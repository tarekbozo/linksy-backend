// src/image/image-tier.helper.ts
//
// Determines which image generation model to use based on the user's
// monthly image count and prompt complexity.
//
// Tier rules:
//   Images  1–20  → HIGH   (imagen-4.0-generate-001,      15 credits)
//   Images 21–70  → MEDIUM (imagen-4.0-fast-generate-001, 10 credits)
//   Images 71–100 → LOW    (fal.ai Flux/dev,               5 credits)
//   After 100     → BLOCKED

import { IMAGE_CREDIT_COST } from "../billing/billing.plans";

export type ImageTier = "HIGH" | "MEDIUM" | "LOW";
export type ImageProvider = "google" | "fal";

export interface TierResult {
  tier: ImageTier;
  model: string;
  provider: ImageProvider;
  creditsPerImage: number;
  isOverride: boolean; // true = complex-prompt bumped tier back to HIGH
}

// ── Tier boundaries ───────────────────────────────────────────────────────────

const HIGH_LIMIT = 20; // images 1–20
const MEDIUM_LIMIT = 70; // images 21–70
const HARD_CAP = 100; // images 71–100, then blocked
const MAX_OVERRIDES = 5; // high-quality overrides allowed per month

// ── Model map ─────────────────────────────────────────────────────────────────

const TIER_MODEL: Record<
  ImageTier,
  { model: string; provider: ImageProvider }
> = {
  HIGH: {
    model: "imagen-4.0-generate-001",
    provider: "google",
  },
  MEDIUM: {
    model: "imagen-4.0-fast-generate-001",
    provider: "google",
  },
  LOW: {
    model: "fal-ai/flux/dev",
    provider: "fal",
  },
};

// ── Complexity detection ──────────────────────────────────────────────────────

const ART_STYLE_KEYWORDS = [
  // English
  "cinematic",
  "photorealistic",
  "hyperrealistic",
  "oil painting",
  "8k",
  "4k",
  "ultra detailed",
  "ultra-detailed",
  "masterpiece",
  "award winning",
  "professional photography",
  "studio lighting",
  "bokeh",
  "dramatic lighting",
  "sharp focus",
  // Arabic
  "زيتي",
  "واقعي",
  "احترافي",
  "عالي الجودة",
  "دقيق جداً",
  "إضاءة سينمائية",
  "تصوير احترافي",
];

export function isComplexPrompt(prompt: string): boolean {
  if (prompt.length > 200) return true;
  const lower = prompt.toLowerCase();
  return ART_STYLE_KEYWORDS.some((kw) => lower.includes(kw));
}

// ── Main routing function ─────────────────────────────────────────────────────

/**
 * Returns the tier, model, provider, and credit cost for the next image.
 *
 * @param imagesThisMonth  How many images the user has generated this billing month
 * @param overridesUsed    How many high-quality overrides they've already used this month
 * @param prompt           The generation prompt (used for complexity check)
 */
export function getImageTier(
  imagesThisMonth: number,
  overridesUsed: number,
  prompt: string,
): TierResult {
  // Determine base tier from count
  let tier: ImageTier;
  if (imagesThisMonth < HIGH_LIMIT) {
    tier = "HIGH";
  } else if (imagesThisMonth < MEDIUM_LIMIT) {
    tier = "MEDIUM";
  } else {
    tier = "LOW";
  }

  // High-quality override: bump MEDIUM → HIGH for complex prompts (21–70 range only)
  // Does NOT apply to LOW tier (71–100) — Flux is always used beyond image 70.
  const complex = isComplexPrompt(prompt);
  const canOverride =
    tier === "MEDIUM" && complex && overridesUsed < MAX_OVERRIDES;

  const isOverride = canOverride;
  if (isOverride) tier = "HIGH";

  const { model, provider } = TIER_MODEL[tier];
  return {
    tier,
    model,
    provider,
    creditsPerImage: IMAGE_CREDIT_COST[tier],
    isOverride,
  };
}

// ── Exported constants for callers ────────────────────────────────────────────

export { HARD_CAP, MAX_OVERRIDES };
