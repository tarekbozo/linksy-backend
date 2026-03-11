// src/image/image.service.ts
import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ConfigService } from "@nestjs/config";
import { GoogleGenAI } from "@google/genai";

@Injectable()
export class ImageService {
  private readonly ai: GoogleGenAI;

  constructor(
    private readonly prisma: PrismaService,
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

    // ── 1. Load pass ──────────────────────────────────────────────────────
    const pass = await this.prisma.pass.findUnique({ where: { userId } });

    if (!pass) {
      throw new ForbiddenException("No active pass found");
    }

    // ── 2. Check plan allows images ───────────────────────────────────────
    if (pass.imageCap === 0) {
      throw new ForbiddenException(
        "Image generation requires PRO or ELITE plan",
      );
    }

    // ── 3. Check pass not expired ─────────────────────────────────────────
    if (new Date() > pass.endsAt) {
      throw new ForbiddenException(
        "Your pass has expired. Please renew to generate images.",
      );
    }

    // ── 4. Check monthly quota ────────────────────────────────────────────
    if (pass.imagesUsed >= pass.imageCap) {
      throw new ForbiddenException(
        `لقد استنفذت حصتك الشهرية من الصور (${pass.imageCap} صورة). تتجدد مع باقتك القادمة.`,
      );
    }

    // ── 5. Call Imagen 4 ──────────────────────────────────────────────────
    try {
      const response = await this.ai.models.generateImages({
        model: "imagen-4.0-generate-001",
        prompt: prompt.trim(),
        config: {
          numberOfImages: 1,
          aspectRatio,
          outputMimeType: "image/jpeg",
          //safetyFilterLevel: 'BLOCK_MEDIUM_AND_ABOVE',
        },
      });

      const generatedImage = response.generatedImages?.[0];
      if (!generatedImage?.image?.imageBytes) {
        throw new BadRequestException("No image returned from API");
      }

      // imageBytes is already a base64 string in the JS SDK
      const rawBytes = generatedImage.image.imageBytes;
      const base64 =
        typeof rawBytes === "string"
          ? rawBytes
          : Buffer.from(rawBytes as any).toString("base64");

      // ── 6. Persist atomically ─────────────────────────────────────────
      await Promise.all([
        this.prisma.pass.update({
          where: { userId },
          data: { imagesUsed: { increment: 1 } },
        }),
        this.prisma.generatedImage.create({
          data: {
            userId,
            prompt: prompt.trim(),
            model: "imagen-4.0-generate-001",
          },
        }),
        this.prisma.usageLog.create({
          data: {
            userId,
            type: "IMAGE",
            model: "imagen-4.0-generate-001",
            images: 1,
          },
        }),
      ]);

      return {
        base64,
        mimeType: "image/jpeg",
        prompt: prompt.trim(),
        imagesUsed: pass.imagesUsed + 1,
        imagesLimit: pass.imageCap,
        remaining: pass.imageCap - (pass.imagesUsed + 1),
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
    const pass = await this.prisma.pass.findUnique({ where: { userId } });

    if (!pass) {
      return {
        plan: "FREE",
        limit: 0,
        used: 0,
        remaining: 0,
        hasAccess: false,
      };
    }

    const expired = new Date() > pass.endsAt;

    return {
      plan: pass.plan,
      limit: pass.imageCap,
      used: pass.imagesUsed,
      remaining: expired ? 0 : Math.max(0, pass.imageCap - pass.imagesUsed),
      hasAccess: pass.imageCap > 0 && !expired,
      expiresAt: pass.endsAt,
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
