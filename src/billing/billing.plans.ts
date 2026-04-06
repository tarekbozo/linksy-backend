import { Plan } from "@prisma/client";

export const PLAN_CONFIG: Record<
  Plan,
  {
    priceSYP: number;
    credits: number;
    durationDays: number;
    features: string[];
    monthlyImageCap: number; // 0 = no access, -1 = unlimited
  }
> = {
  FREE: {
    priceSYP: 0,
    credits: 10,
    durationDays: 0,
    features: ["basic_chat"],
    monthlyImageCap: 0,
  },
  STUDENT: {
    priceSYP: 15000,
    credits: 300,
    durationDays: 30,
    features: [
      "basic_chat",
      "advanced_chat",
      "summarize",
      "explain",
      "voice_to_text",
      "translate",
    ],
    monthlyImageCap: 0,
  },
  FREELANCER: {
    priceSYP: 30000,
    credits: 800,
    durationDays: 30,
    features: [
      "basic_chat",
      "advanced_chat",
      "summarize",
      "explain",
      "voice_to_text",
      "translate",
      "professional_writing",
      "client_replies",
      "cv_proposals",
      "image_generation",
      "social_content",
    ],
    monthlyImageCap: 30, // 30 images/month for freelancer
  },
  CREATOR: {
    priceSYP: 50000,
    credits: 1500,
    durationDays: 30,
    features: [
      "basic_chat",
      "advanced_chat",
      "summarize",
      "explain",
      "voice_to_text",
      "translate",
      "professional_writing",
      "client_replies",
      "cv_proposals",
      "image_generation",
      "social_content",
      "ads_writing",
      "product_descriptions",
      "voice_generation",
    ],
    monthlyImageCap: 100, // 100 images/month, tier-routed
  },
};

export const CREDIT_COST: Record<string, number> = {
  BASIC_CHAT: 1,
  ADVANCED_CHAT: 2,
  IMAGE_GENERATION: 10, // fallback / legacy — new code uses IMAGE_CREDIT_COST
  VOICE_GENERATION: 2,
  VIDEO_GENERATION: 50,
};

// Tier-based image credit costs
export const IMAGE_CREDIT_COST: Record<"HIGH" | "MEDIUM" | "LOW", number> = {
  HIGH: 15,   // imagen-4.0-generate-001 (images 1–20)
  MEDIUM: 10, // imagen-4.0-fast-generate-001 (images 21–70)
  LOW: 5,     // fal.ai Flux (images 71–100)
};

export const BASIC_MODELS = ["gemini-2.5-flash"];

export const PAID_PLANS: Plan[] = [Plan.STUDENT, Plan.FREELANCER, Plan.CREATOR];
