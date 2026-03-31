import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ActionType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { BillingService } from "../billing/billing.service";

const SUPPORTED_AUDIO = [
  "audio/mp3",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/webm",
  "audio/mp4",
  "audio/m4a",
  "audio/flac",
];

const MAX_BYTES = 20 * 1024 * 1024; // 20MB

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);
  private readonly gemini: GoogleGenerativeAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly billing: BillingService,
    private readonly config: ConfigService,
  ) {
    this.gemini = new GoogleGenerativeAI(
      this.config.get<string>("GEMINI_API_KEY")!,
    );
  }

  async transcribe(
    userId: string,
    audioBase64: string,
    mimeType: string,
    language: "ar" | "en" | "auto" = "auto",
  ): Promise<{ text: string; creditsUsed: number; creditsRemaining: number }> {
    // 1. Validate mime type
    const normalizedMime = mimeType.toLowerCase();
    if (
      !SUPPORTED_AUDIO.some((t) => normalizedMime.includes(t.split("/")[1]))
    ) {
      throw new BadRequestException(
        `نوع الملف غير مدعوم. الأنواع المدعومة: mp3, wav, ogg, webm, m4a`,
      );
    }

    // 2. Validate size
    const bytes = Buffer.from(audioBase64, "base64").length;
    if (bytes > MAX_BYTES) {
      throw new BadRequestException("حجم الملف كبير جداً. الحد الأقصى 20MB");
    }

    // 3. Check billing
    const canUse = await this.billing.canConsume(
      userId,
      ActionType.VOICE_GENERATION,
    );
    if (!canUse.allowed) throw new ForbiddenException(canUse.message);

    // 4. Build language prompt
    const langHint =
      language === "ar"
        ? "The audio is in Arabic. Transcribe accurately preserving dialect."
        : language === "en"
          ? "The audio is in English."
          : "Detect the language and transcribe accurately. If Arabic, preserve the dialect.";

    // 5. Call Gemini
    try {
      const model = this.gemini.getGenerativeModel({
        model: "gemini-2.5-flash",
      });

      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: normalizedMime,
            data: audioBase64,
          },
        },
        {
          text: `You are a professional transcription service. ${langHint}
Transcribe the audio exactly as spoken. 
Return ONLY the transcribed text with no commentary, labels, or formatting.
If the audio is silent or unclear, return: [لا يوجد كلام واضح]`,
        },
      ]);

      const text = result.response.text().trim();

      // 6. Deduct credits
      await this.billing.consume(
        userId,
        ActionType.VOICE_GENERATION,
        "gemini-2.5-flash",
      );

      const balance = await this.billing.getBalance(userId);

      return {
        text,
        creditsUsed: canUse.cost,
        creditsRemaining: balance,
      };
    } catch (err: any) {
      if (
        err instanceof ForbiddenException ||
        err instanceof BadRequestException
      )
        throw err;
      this.logger.error("Transcription failed", err);
      throw new BadRequestException(
        "فشل التحويل. تأكد من جودة الملف الصوتي وحاول مجدداً.",
      );
    }
  }
}
