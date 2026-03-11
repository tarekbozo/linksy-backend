import { Plan } from '@prisma/client';
export declare const PLAN_CONFIG: Record<Plan, {
    amountSYP: number;
    durationDays: number;
    tokenCap: number;
    imageCap: number;
    dailyTokenCap?: number;
}>;
export declare const PAID_PLANS: Plan[];
