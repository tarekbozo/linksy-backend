import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { ActionType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { BillingService } from "../billing/billing.service";
import { ConfigService } from "@nestjs/config";
import { GoogleGenAI } from "@google/genai";

@Injectable()
export class ImageService {
  private readonly ai: GoogleGenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly billing: BillingService,
    private readonly config: ConfigService,
  ) {
    this.ai = new GoogleGenAI({
      apiKey: this.config.get<string>("GEMINI_API_KEY")!,
    });
  }

  // ── Generate ───────────────────────────────────────────────────────────────

  async generate(
    userId: string,
    prompt: string,
    aspectRatio: "1:1" | "16:9" | "9:16" | "4:3" = "1:1",
  ) {
    if (!prompt?.trim()) throw new BadRequestException("Prompt is required");

    // 1. Check credits + feature gate
    const canUse = await this.billing.canConsume(
      userId,
      ActionType.IMAGE_GENERATION,
    );
    if (!canUse.allowed) throw new ForbiddenException(canUse.message);

    // 2. Call Imagen 4
    try {
      const response = await this.ai.models.generateImages({
        model: "imagen-4.0-generate-001",
        prompt: prompt.trim(),
        config: {
          numberOfImages: 1,
          aspectRatio,
          outputMimeType: "image/jpeg",
        },
      });

      const generatedImage = response.generatedImages?.[0];
      if (!generatedImage?.image?.imageBytes) {
        throw new BadRequestException("No image returned from API");
      }

      const rawBytes = generatedImage.image.imageBytes;
      const base64 =
        typeof rawBytes === "string"
          ? rawBytes
          : Buffer.from(rawBytes as any).toString("base64");

      // 3. Persist + deduct credits atomically
      await Promise.all([
        this.prisma.generatedImage.create({
          data: {
            userId,
            prompt: prompt.trim(),
            model: "imagen-4.0-generate-001",
          },
        }),
        this.billing.consume(
          userId,
          ActionType.IMAGE_GENERATION,
          "imagen-4.0-generate-001",
        ),
      ]);

      const balance = await this.billing.getBalance(userId);

      return {
        base64,
        mimeType: "image/jpeg",
        prompt: prompt.trim(),
        creditsUsed: canUse.cost,
        creditsRemaining: balance,
      };
    } catch (err: any) {
      if (
        err instanceof ForbiddenException ||
        err instanceof BadRequestException
      )
        throw err;
      throw new BadRequestException(err?.message ?? "Image generation failed");
    }
  }

  // ── Status ─────────────────────────────────────────────────────────────────

  async getStatus(userId: string) {
    const status = await this.billing.getStatus(userId);
    return {
      plan: status.plan,
      balance: status.balance,
      hasAccess: status.features.includes("image_generation"),
      creditCostPerImage: 10,
    };
  }

  // ── History ────────────────────────────────────────────────────────────────

  async getHistory(userId: string, take = 20) {
    return this.prisma.generatedImage.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
      select: { id: true, prompt: true, createdAt: true },
    });
  }
}
