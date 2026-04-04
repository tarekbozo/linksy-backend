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
import { PLAN_CONFIG, CREDIT_COST } from "../billing/billing.plans";
import { Plan } from "@prisma/client";

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

      const afterStatus = await this.getStatus(userId);

      return {
        base64,
        mimeType: "image/jpeg",
        prompt: prompt.trim(),
        imagesUsed: afterStatus.used,
        imagesLimit: afterStatus.limit,
        remaining: afterStatus.remaining,
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
    const plan = status.plan as Plan;
    const cfg = PLAN_CONFIG[plan];
    const cost = CREDIT_COST["IMAGE_GENERATION"];
    const hasAccess = status.features.includes("image_generation");

    // Count images generated in the current calendar month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const imagesThisMonth = await this.prisma.generatedImage.count({
      where: { userId, createdAt: { gte: monthStart } },
    });

    let limit: number;
    let used: number;
    let remaining: number;

    if (cfg.monthlyImageCap === -1) {
      // Unlimited cap (CREATOR) — derive limit from plan credits
      limit = Math.floor(cfg.credits / cost);
      remaining = Math.floor(status.balance / cost);
      used = Math.max(0, limit - remaining);
    } else if (cfg.monthlyImageCap === 0) {
      // No image access
      limit = 0;
      used = 0;
      remaining = 0;
    } else {
      // Fixed monthly cap (e.g., FREELANCER: 30)
      limit = cfg.monthlyImageCap;
      used = Math.min(imagesThisMonth, limit);
      remaining = Math.max(
        0,
        Math.min(limit - used, Math.floor(status.balance / cost)),
      );
    }

    return { plan, hasAccess, limit, used, remaining, creditCostPerImage: cost };
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
