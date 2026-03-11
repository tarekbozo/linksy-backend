import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
export declare class UsersService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    findAll(params: {
        role?: Role;
        search?: string;
        skip?: number;
        take?: number;
    }): Promise<{
        users: {
            id: string;
            createdAt: Date;
            email: string;
            role: import(".prisma/client").$Enums.Role;
            isActive: boolean;
            onboarded: boolean;
            pass: {
                plan: import(".prisma/client").$Enums.Plan;
                endsAt: Date;
            } | null;
        }[];
        total: number;
        skip: number;
        take: number;
    }>;
    findOne(id: string): Promise<{
        id: string;
        createdAt: Date;
        email: string;
        role: import(".prisma/client").$Enums.Role;
        isActive: boolean;
        onboarded: boolean;
        orders: {
            id: string;
            createdAt: Date;
            userId: string;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.OrderStatus;
            plan: import(".prisma/client").$Enums.Plan;
            agentId: string | null;
            amountSYP: number;
            confirmedAt: Date | null;
        }[];
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
        } | null;
        auditLogs: {
            action: import(".prisma/client").$Enums.AuditAction;
            metadata: import("@prisma/client/runtime/client").JsonValue;
            createdAt: Date;
        }[];
    }>;
    setRole(targetId: string, role: Role, actorId: string): Promise<{
        id: string;
        email: string;
        role: import(".prisma/client").$Enums.Role;
    }>;
    setActive(targetId: string, isActive: boolean, actorId: string): Promise<{
        id: string;
        email: string;
        isActive: boolean;
    }>;
    getOrderById(orderId: string): Promise<{
        user: {
            id: string;
            email: string;
        };
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
    getAgentOrders(agentId: string): Promise<({
        user: {
            id: string;
            email: string;
        };
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
    })[]>;
    getAgentStats(agentId: string): Promise<{
        confirmedOrders: number;
        pendingOrders: number;
        totalCollectedSYP: number;
    }>;
}
