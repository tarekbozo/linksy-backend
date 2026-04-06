// src/image/image.service.ts

import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { ActionType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { BillingService } from "../billing/billing.service";
import { ConfigService } from "@nestjs/config";
import { GoogleGenAI } from "@google/genai";
import { PLAN_CONFIG } from "../billing/billing.plans";
import { Plan } from "@prisma/client";
import {
  getImageTier,
  HARD_CAP,
  MAX_OVERRIDES,
} from "./image-tier.helper";

// ── Aspect-ratio maps ─────────────────────────────────────────────────────────

type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3";

const GOOGLE_ASPECT_RATIO: Record<AspectRatio, string> = {
  "1:1": "1:1",
  "16:9": "16:9",
  "9:16": "9:16",
  "4:3": "4:3",
};

// fal.ai uses named presets
const FAL_IMAGE_SIZE: Record<AspectRatio, string> = {
  "1:1": "square_hd",
  "16:9": "landscape_16_9",
  "9:16": "portrait_16_9",
  "4:3": "landscape_4_3",
};

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);
  private readonly googleAi: GoogleGenAI;
  private readonly falKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly billing: BillingService,
    private readonly config: ConfigService,
  ) {
    this.googleAi = new GoogleGenAI({
      apiKey: this.config.get<string>("GEMINI_API_KEY")!,
    });
    this.falKey = this.config.get<string>("FAL_KEY") ?? "";
    if (!this.falKey) {
      this.logger.warn("FAL_KEY not set — fal.ai (Flux) tier will fail");
    }
  }

  // ── Generate ─────────────────────────────────────────────────────────────────

  async generate(
    userId: string,
    prompt: string,
    aspectRatio: AspectRatio = "1:1",
  ) {
    if (!prompt?.trim()) throw new BadRequestException("Prompt is required");

    // 1. Feature gate — does the plan include image_generation?
    const billingStatus = await this.billing.getStatus(userId);
    if (!billingStatus.features.includes("image_generation")) {
      throw new ForbiddenException(
        "ميزة متاحة في باقة المستقل وأعلى",
      );
    }

    const plan = billingStatus.plan as Plan;
    const cfg = PLAN_CONFIG[plan];
    const monthStart = this.getMonthStart();

    // 2. Credit balance pre-check (fast fail before acquiring lock)
    //    We re-verify inside the transaction, but this avoids holding the lock
    //    while waiting on a DB round-trip for users who obviously can't afford it.
    const balancePreCheck = await this.billing.getBalance(userId);
    // We don't know the exact tier yet; use the cheapest cost as the lower bound.
    // The real check happens after tier resolution below.
    if (balancePreCheck <= 0) {
      throw new ForbiddenException(
        "رصيدك غير كافٍ لتوليد صورة. قم بشراء شحن إضافي.",
      );
    }

    // 3. ATOMIC: advisory lock → count check → slot reservation
    //    pg_advisory_xact_lock serialises all generate() calls for the same user,
    //    so two simultaneous requests cannot both pass the cap check.
    let reservedId: string;
    let tierResult: ReturnType<typeof getImageTier>;

    try {
      await this.prisma.$transaction(async (tx) => {
        // Lock is scoped to this transaction and released on commit/rollback.
        // Namespace 42 avoids clashing with any other advisory locks in the app.
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(42, hashtext(${userId}))`;

        const imagesThisMonth = await tx.generatedImage.count({
          where: { userId, createdAt: { gte: monthStart } },
        });

        if (imagesThisMonth >= HARD_CAP || imagesThisMonth >= cfg.monthlyImageCap) {
          throw new ForbiddenException(
            "لقد وصلت للحد الأقصى من الصور هذا الشهر",
          );
        }

        const overridesUsed = await tx.generatedImage.count({
          where: { userId, isOverride: true, createdAt: { gte: monthStart } },
        });

        tierResult = getImageTier(imagesThisMonth, overridesUsed, prompt.trim());

        // Credit balance check with the real tier cost
        const balance = await this.billing.getBalance(userId);
        if (balance < tierResult.creditsPerImage) {
          throw new ForbiddenException(
            "رصيدك غير كافٍ لتوليد صورة. قم بشراء شحن إضافي.",
          );
        }

        // Reserve the slot NOW — this record is what prevents a concurrent
        // request from also passing the cap check.
        const reserved = await tx.generatedImage.create({
          data: {
            userId,
            prompt: prompt.trim(),
            model: tierResult.model,
            tier: tierResult.tier,
            isOverride: tierResult.isOverride,
          },
          select: { id: true },
        });
        reservedId = reserved.id;
      });
    } catch (err: any) {
      // Re-throw ForbiddenException / BadRequestException as-is
      if (
        err instanceof ForbiddenException ||
        err instanceof BadRequestException
      )
        throw err;
      throw new BadRequestException(
        err?.message ?? "فشل توليد الصورة. حاول مرة أخرى.",
      );
    }

    // 4. Generate image OUTSIDE the transaction (10–30 s external call)
    let base64: string;
    let mimeType: string;

    try {
      if (tierResult!.provider === "google") {
        ({ base64, mimeType } = await this.generateGoogle(
          prompt.trim(),
          tierResult!.model,
          aspectRatio,
        ));
      } else {
        ({ base64, mimeType } = await this.generateFal(
          prompt.trim(),
          aspectRatio,
        ));
      }
    } catch (err: any) {
      // Generation failed — delete the reserved slot so the count reverts.
      // Do NOT deduct credits.
      await this.prisma.generatedImage
        .delete({ where: { id: reservedId! } })
        .catch(() => {}); // best-effort; ignore if already gone

      if (
        err instanceof ForbiddenException ||
        err instanceof BadRequestException
      )
        throw err;
      throw new BadRequestException(
        err?.message ?? "فشل توليد الصورة. حاول مرة أخرى.",
      );
    }

    // 5. Deduct credits (generation succeeded)
    await this.billing.deductFixed(
      userId,
      tierResult!.creditsPerImage,
      ActionType.IMAGE_GENERATION,
      {
        tier: tierResult!.tier,
        model: tierResult!.model,
        isOverride: tierResult!.isOverride,
        prompt: prompt.trim().slice(0, 100),
      },
    );

    const afterStatus = await this.getStatus(userId);

    return {
      base64,
      mimeType,
      prompt: prompt.trim(),
      imagesUsed: afterStatus.used,
      imagesLimit: afterStatus.limit,
      remaining: afterStatus.remaining,
      creditCostPerImage: tierResult!.creditsPerImage,
    };
  }

  // ── Google Imagen ─────────────────────────────────────────────────────────

  private async generateGoogle(
    prompt: string,
    model: string,
    aspectRatio: AspectRatio,
  ): Promise<{ base64: string; mimeType: string }> {
    const response = await this.googleAi.models.generateImages({
      model,
      prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: GOOGLE_ASPECT_RATIO[aspectRatio],
        outputMimeType: "image/jpeg",
      },
    });

    const generated = response.generatedImages?.[0];
    if (!generated?.image?.imageBytes) {
      throw new BadRequestException("No image returned from Google Imagen");
    }

    const rawBytes = generated.image.imageBytes;
    const base64 =
      typeof rawBytes === "string"
        ? rawBytes
        : Buffer.from(rawBytes as any).toString("base64");

    return { base64, mimeType: "image/jpeg" };
  }

  // ── fal.ai Flux ──────────────────────────────────────────────────────────

  private async generateFal(
    prompt: string,
    aspectRatio: AspectRatio,
  ): Promise<{ base64: string; mimeType: string }> {
    if (!this.falKey) {
      throw new BadRequestException("fal.ai key not configured");
    }

    const res = await fetch("https://fal.run/fal-ai/flux/dev", {
      method: "POST",
      headers: {
        Authorization: `Key ${this.falKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        image_size: FAL_IMAGE_SIZE[aspectRatio],
        num_images: 1,
        output_format: "jpeg",
        enable_safety_checker: true,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      throw new BadRequestException(`fal.ai error ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as {
      images?: { url: string; content_type?: string }[];
    };

    const imageUrl = data.images?.[0]?.url;
    if (!imageUrl) {
      throw new BadRequestException("No image URL returned from fal.ai");
    }

    // Fetch the image URL and convert to base64
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      throw new BadRequestException("Failed to fetch generated image from fal.ai");
    }

    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const base64 = buffer.toString("base64");
    const mimeType = data.images?.[0]?.content_type ?? "image/jpeg";

    return { base64, mimeType };
  }

  // ── Status ────────────────────────────────────────────────────────────────

  async getStatus(userId: string) {
    const billingStatus = await this.billing.getStatus(userId);
    const plan = billingStatus.plan as Plan;
    const cfg = PLAN_CONFIG[plan];
    const hasAccess = billingStatus.features.includes("image_generation");

    // Early return for plans without image access — no DB queries needed.
    if (!hasAccess) {
      return {
        plan,
        hasAccess: false,
        limit: 0,
        used: 0,
        remaining: 0,
        blockedBy: null as null,
        currentTier: null,
        creditCostPerImage: 0,
        overridesRemaining: 0,
      };
    }

    const monthStart = this.getMonthStart();
    const imagesThisMonth = await this.prisma.generatedImage.count({
      where: { userId, createdAt: { gte: monthStart } },
    });
    const overridesUsed = await this.prisma.generatedImage.count({
      where: { userId, isOverride: true, createdAt: { gte: monthStart } },
    });

    const limit = cfg.monthlyImageCap; // 30 (FREELANCER) or 100 (CREATOR)
    const used = Math.min(imagesThisMonth, limit);
    const monthlyRemaining = Math.max(0, limit - used);

    // Current tier = what the NEXT image would use
    const tierResult = getImageTier(imagesThisMonth, overridesUsed, "");
    const creditCostPerImage = tierResult.creditsPerImage;

    // Cap remaining by how many images the user can afford at the current tier cost
    const balance = await this.billing.getBalance(userId);
    const affordableImages = Math.floor(balance / creditCostPerImage);
    const remaining = Math.min(monthlyRemaining, affordableImages);

    // Tell the frontend WHY remaining is 0 so it can show the right message
    let blockedBy: "QUOTA" | "CREDITS" | null = null;
    if (monthlyRemaining === 0) blockedBy = "QUOTA";
    else if (affordableImages === 0) blockedBy = "CREDITS";

    return {
      plan,
      hasAccess: true,
      limit,
      used,
      remaining,
      blockedBy,
      currentTier: imagesThisMonth >= limit ? null : tierResult.tier,
      creditCostPerImage,
      overridesRemaining: Math.max(0, MAX_OVERRIDES - overridesUsed),
    };
  }

  // ── History ───────────────────────────────────────────────────────────────

  async getHistory(userId: string, take = 20) {
    return this.prisma.generatedImage.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
      select: { id: true, prompt: true, createdAt: true },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private getMonthStart(): Date {
    const d = new Date();
    d.setUTCDate(1);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }
}
