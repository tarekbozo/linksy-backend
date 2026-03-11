"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let UsersService = class UsersService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async findAll(params) {
        const { role, search, skip = 0, take = 50 } = params;
        const where = {};
        if (role)
            where.role = role;
        if (search)
            where.email = { contains: search, mode: 'insensitive' };
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    isActive: true,
                    onboarded: true,
                    createdAt: true,
                    pass: { select: { plan: true, endsAt: true } },
                },
            }),
            this.prisma.user.count({ where }),
        ]);
        return { users, total, skip, take };
    }
    async findOne(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
                onboarded: true,
                createdAt: true,
                pass: true,
                orders: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
                auditLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                    select: { action: true, metadata: true, createdAt: true },
                },
            },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found.');
        return user;
    }
    async setRole(targetId, role, actorId) {
        if (targetId === actorId)
            throw new common_1.BadRequestException('You cannot change your own role.');
        const target = await this.prisma.user.findUnique({
            where: { id: targetId },
            select: { id: true, role: true },
        });
        if (!target)
            throw new common_1.NotFoundException('User not found.');
        const user = await this.prisma.user.update({
            where: { id: targetId },
            data: { role },
            select: { id: true, email: true, role: true },
        });
        await this.audit.log({
            userId: targetId,
            actorId,
            action: client_1.AuditAction.ROLE_CHANGED,
            metadata: { from: target.role, to: role },
        });
        return user;
    }
    async setActive(targetId, isActive, actorId) {
        if (targetId === actorId)
            throw new common_1.BadRequestException('You cannot deactivate yourself.');
        const user = await this.prisma.user.update({
            where: { id: targetId },
            data: { isActive },
            select: { id: true, email: true, isActive: true },
        });
        await this.audit.log({
            userId: targetId,
            actorId,
            action: client_1.AuditAction.USER_DEACTIVATED,
            metadata: { isActive },
        });
        return user;
    }
    async getOrderById(orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { user: { select: { id: true, email: true } } },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found.');
        return order;
    }
    async getAgentOrders(agentId) {
        return this.prisma.order.findMany({
            where: {
                OR: [
                    { agentId, status: 'PAID' },
                    { status: 'PENDING' },
                ],
            },
            include: { user: { select: { id: true, email: true } } },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
    async getAgentStats(agentId) {
        const [confirmed, pending, totalSYP] = await Promise.all([
            this.prisma.order.count({ where: { agentId, status: 'PAID' } }),
            this.prisma.order.count({ where: { status: 'PENDING' } }),
            this.prisma.order.aggregate({
                where: { agentId, status: 'PAID' },
                _sum: { amountSYP: true },
            }),
        ]);
        return {
            confirmedOrders: confirmed,
            pendingOrders: pending,
            totalCollectedSYP: totalSYP._sum.amountSYP ?? 0,
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], UsersService);
//# sourceMappingURL=users.service.js.map