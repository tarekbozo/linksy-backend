import { BillingService } from './billing.service';
import { SelectPlanDto } from './dto/select-plan.dto';
import { UsageCheckDto } from './dto/usage.dto';
import { ConfirmOrderDto } from './dto/confirm-order.dto';
import { AuthUser } from 'src/auth/decorators';
export declare class BillingController {
    private readonly billing;
    constructor(billing: BillingService);
    listPlans(): {
        amountSYP: number;
        durationDays: number;
        tokenCap: number;
        imageCap: number;
        dailyTokenCap?: number;
        plan: string;
    }[];
    myPass(user: AuthUser): Promise<{
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
    status(user: AuthUser): Promise<{
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
    select(user: AuthUser, dto: SelectPlanDto): Promise<{
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
    getOrder(id: string): Promise<{
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
    getActivity(user: AuthUser, take?: string): Promise<{
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.UsageType;
        tokens: number;
        images: number;
        model: string | null;
    }[]>;
    confirmOrder(user: AuthUser, id: string, dto: ConfirmOrderDto): Promise<{
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
    check(user: AuthUser, dto: UsageCheckDto): Promise<{
        allowed: boolean;
        reason: string;
        message: string;
    } | {
        allowed: boolean;
        reason: null;
        message: string;
    }>;
    consume(user: AuthUser, dto: UsageCheckDto): Promise<{
        ok: boolean;
    }>;
}
