import { Plan, UsageType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from 'src/email/email.service';
export declare class BillingService {
    private readonly prisma;
    private readonly audit;
    private readonly email;
    private readonly logger;
    constructor(prisma: PrismaService, audit: AuditService, email: EmailService);
    listPlans(): {
        amountSYP: number;
        durationDays: number;
        tokenCap: number;
        imageCap: number;
        dailyTokenCap?: number;
        plan: string;
    }[];
    getMyPass(userId: string): Promise<{
        id: string;
        userId: string;
        updatedAt: Date;
        plan: import(".prisma/client").$Enums.Plan;
        startsAt: Date;
        endsAt: Date;
        tokenCap: number;
        imageCap: number;
        tokensUsed: number;
        imagesUsed: number;
    } | null>;
    getUsageStatus(userId: string): Promise<{
        hasPass: boolean;
        plan: null;
        onboarded: boolean;
        upgradeRequired: boolean;
        message: string;
        passEndsAt?: undefined;
        daily?: undefined;
        tokenCap?: undefined;
        tokensUsed?: undefined;
        imageCap?: undefined;
        imagesUsed?: undefined;
    } | {
        hasPass: boolean;
        onboarded: boolean;
        plan: import(".prisma/client").$Enums.Plan;
        passEndsAt: Date;
        daily: {
            cap: number;
            used: number;
            remaining: number;
        } | null;
        tokenCap: number;
        tokensUsed: number;
        imageCap: number;
        imagesUsed: number;
        upgradeRequired: boolean;
        message: string;
    }>;
    selectPlan(userId: string, plan: Plan): Promise<{
        mode: "activated";
        pass: {
            id: string;
            userId: string;
            updatedAt: Date;
            plan: import(".prisma/client").$Enums.Plan;
            startsAt: Date;
            endsAt: Date;
            tokenCap: number;
            imageCap: number;
            tokensUsed: number;
            imagesUsed: number;
        };
        order?: undefined;
    } | {
        mode: "order";
        order: {
            id: string;
            createdAt: Date;
            userId: string;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.OrderStatus;
            plan: import(".prisma/client").$Enums.Plan;
            agentId: string | null;
            amountSYP: number;
            confirmedAt: Date | null;
        };
        pass?: undefined;
    }>;
    getOrderById(orderId: string): Promise<{
        user: {
            id: string;
            email: string;
        };
        agent: {
            id: string;
            email: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OrderStatus;
        plan: import(".prisma/client").$Enums.Plan;
        agentId: string | null;
        amountSYP: number;
        confirmedAt: Date | null;
    }>;
    getActivity(userId: string, take?: number): Promise<{
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.UsageType;
        tokens: number;
        images: number;
        model: string | null;
    }[]>;
    confirmOrder(actorId: string, orderId: string, reference?: string): Promise<{
        order: {
            id: string;
            createdAt: Date;
            userId: string;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.OrderStatus;
            plan: import(".prisma/client").$Enums.Plan;
            agentId: string | null;
            amountSYP: number;
            confirmedAt: Date | null;
        };
        pass: {
            id: string;
            userId: string;
            updatedAt: Date;
            plan: import(".prisma/client").$Enums.Plan;
            startsAt: Date;
            endsAt: Date;
            tokenCap: number;
            imageCap: number;
            tokensUsed: number;
            imagesUsed: number;
        };
    }>;
    canConsume(userId: string, type: UsageType, tokens: number, images?: number): Promise<{
        allowed: boolean;
        reason: string;
        message: string;
    } | {
        allowed: boolean;
        reason: null;
        message: string;
    }>;
    consume(userId: string, type: UsageType, tokens: number, images?: number, model?: string): Promise<{
        ok: boolean;
    }>;
}
