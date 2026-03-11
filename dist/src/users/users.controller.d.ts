import { AuthUser } from '../auth/decorators';
import { ListUsersDto } from './dto/ListUsersDto';
import { UsersService } from './users.service';
import { SetRoleDto } from './dto/SetRoleDto';
import { SetActiveDto } from './dto/SetActiveDto';
export declare class UsersController {
    private readonly users;
    constructor(users: UsersService);
    findAll(query: ListUsersDto): Promise<{
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
    setRole(id: string, dto: SetRoleDto, actor: AuthUser): Promise<{
        id: string;
        email: string;
        role: import(".prisma/client").$Enums.Role;
    }>;
    setActive(id: string, dto: SetActiveDto, actor: AuthUser): Promise<{
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
    getAgentOrders(agent: AuthUser): Promise<({
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
    getAgentStats(agent: AuthUser): Promise<{
        confirmedOrders: number;
        pendingOrders: number;
        totalCollectedSYP: number;
    }>;
}
