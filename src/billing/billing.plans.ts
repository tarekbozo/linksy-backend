import { Plan } from "@prisma/client";

/**
 * Source of truth for plan limits.
 *
 * Notes:
 * - FREE is enforced as: 2000 tokens/day and a 30-day pass window.
 * - Paid plans are monthly caps (30 days) here; adjust as you like.
 */
export const PLAN_CONFIG: Record<
  Plan,
  {
    amountSYP: number;
    durationDays: number;
    tokenCap: number; // monthly cap for paid, informational for FREE
    imageCap: number;
    dailyTokenCap?: number; // used for FREE
  }
> = {
  FREE: {
    amountSYP: 0,
    durationDays: 30,
    tokenCap: 3000,
    imageCap: 0,
    dailyTokenCap: 3000,
  },
  STARTER: {
    amountSYP: 125000,
    durationDays: 30,
    tokenCap: 400_000,
    imageCap: 0,
  },
  PRO: {
    amountSYP: 260000,
    durationDays: 30,
    tokenCap: 1_000_000,
    imageCap: 200,
  },
  ELITE: {
    amountSYP: 480000,
    durationDays: 30,
    tokenCap: 2_500_000,
    imageCap: 300,
  },
};

export const PAID_PLANS: Plan[] = [Plan.STARTER, Plan.PRO, Plan.ELITE];
