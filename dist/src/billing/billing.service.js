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
var BillingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const billing_plans_1 = require("./billing.plans");
const email_service_1 = require("../email/email.service");
function startOfDayUTC(d = new Date()) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function addDays(d, days) {
    return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}
let BillingService = BillingService_1 = class BillingService {
    prisma;
    audit;
    email;
    logger = new common_1.Logger(BillingService_1.name);
    constructor(prisma, audit, email) {
        this.prisma = prisma;
        this.audit = audit;
        this.email = email;
    }
    listPlans() {
        return Object.entries(billing_plans_1.PLAN_CONFIG).map(([plan, cfg]) => ({
            plan,
            ...cfg,
        }));
    }
    async getMyPass(userId) {
        return this.prisma.pass.findUnique({ where: { userId } });
    }
    async getUsageStatus(userId) {
        const pass = await this.prisma.pass.findUnique({ where: { userId } });
        if (!pass) {
            return {
                hasPass: false,
                plan: null,
                onboarded: false,
                upgradeRequired: true,
                message: 'No active pass. Please select a plan.',
            };
        }
        const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { onboarded: true } });
        const now = new Date();
        const expired = pass.endsAt.getTime() <= now.getTime();
        let daily = null;
        if (pass.plan === client_1.Plan.FREE) {
            const cap = billing_plans_1.PLAN_CONFIG.FREE.dailyTokenCap ?? 3000;
            const dayStart = startOfDayUTC(now);
            const agg = await this.prisma.usageLog.aggregate({
                where: {
                    userId,
                    type: client_1.UsageType.CHAT,
                    createdAt: { gte: dayStart },
                },
                _sum: { tokens: true },
            });
            const used = agg._sum.tokens ?? 0;
            daily = {
                cap,
                used,
                remaining: Math.max(0, cap - used),
            };
        }
        const tokenCapExceeded = pass.tokenCap > 0 && pass.tokensUsed >= pass.tokenCap;
        const imageCapExceeded = pass.imageCap > 0 && pass.imagesUsed >= pass.imageCap;
        const blocked = expired || tokenCapExceeded || imageCapExceeded || (daily ? daily.remaining <= 0 : false);
        const message = expired
            ? 'Your pass expired. Please upgrade your plan.'
            : (daily && daily.remaining <= 0)
                ? `You’ve used today’s ${daily.cap.toLocaleString()} tokens. Upgrade your plan to continue.`
                : tokenCapExceeded
                    ? 'You reached your token cap. Upgrade your plan to continue.'
                    : imageCapExceeded
                        ? 'You reached your image cap. Upgrade your plan to continue.'
                        : 'ok';
        return {
            hasPass: true,
            onboarded: !!user?.onboarded,
            plan: pass.plan,
            passEndsAt: pass.endsAt,
            daily,
            tokenCap: pass.tokenCap,
            tokensUsed: pass.tokensUsed,
            imageCap: pass.imageCap,
            imagesUsed: pass.imagesUsed,
            upgradeRequired: blocked,
            message,
        };
    }
    async selectPlan(userId, plan) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const cfg = billing_plans_1.PLAN_CONFIG[plan];
        if (!cfg)
            throw new common_1.BadRequestException('Unknown plan');
        if (plan === client_1.Plan.FREE) {
            const alreadyHadFree = await this.prisma.auditLog.findFirst({
                where: {
                    userId,
                    action: client_1.AuditAction.PASS_ACTIVATED,
                    metadata: { path: ['plan'], equals: 'FREE' },
                },
            });
            if (alreadyHadFree) {
                throw new common_1.ForbiddenException('Free plan can only be claimed once per email.');
            }
            const now = new Date();
            const endsAt = addDays(now, cfg.durationDays);
            const pass = await this.prisma.pass.upsert({
                where: { userId },
                create: {
                    userId,
                    plan: client_1.Plan.FREE,
                    startsAt: now,
                    endsAt,
                    tokenCap: 0,
                    imageCap: 0,
                },
                update: {
                    plan: client_1.Plan.FREE,
                    startsAt: now,
                    endsAt,
                    tokenCap: 0,
                    imageCap: 0,
                    tokensUsed: 0,
                    imagesUsed: 0,
                },
            });
            await this.prisma.user.update({
                where: { id: userId },
                data: { onboarded: true },
            });
            await this.audit.log({
                userId,
                action: client_1.AuditAction.PASS_ACTIVATED,
                metadata: { plan: 'FREE', endsAt: endsAt.toISOString() },
            });
            return { mode: 'activated', pass };
        }
        if (!billing_plans_1.PAID_PLANS.includes(plan)) {
            throw new common_1.BadRequestException('Invalid paid plan');
        }
        const order = await this.prisma.order.create({
            data: {
                userId,
                plan,
                amountSYP: cfg.amountSYP,
                status: client_1.OrderStatus.PENDING,
            },
        });
        await this.audit.log({
            userId,
            action: client_1.AuditAction.PASS_CREATED,
            metadata: { plan, orderId: order.id, amountSYP: cfg.amountSYP },
        });
        return { mode: 'order', order };
    }
    async getOrderById(orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: { select: { id: true, email: true } },
                agent: { select: { id: true, email: true } },
            },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found.');
        return order;
    }
    async getActivity(userId, take = 10) {
        return this.prisma.usageLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take,
            select: {
                id: true,
                type: true,
                model: true,
                tokens: true,
                images: true,
                createdAt: true,
            },
        });
    }
    async confirmOrder(actorId, orderId, reference) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { user: { select: { email: true } } },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (order.status !== client_1.OrderStatus.PENDING) {
            throw new common_1.BadRequestException('Order is not pending');
        }
        const cfg = billing_plans_1.PLAN_CONFIG[order.plan];
        if (!cfg)
            throw new common_1.BadRequestException('Unknown plan');
        const now = new Date();
        const endsAt = addDays(now, cfg.durationDays);
        const [updatedOrder, pass] = await this.prisma.$transaction([
            this.prisma.order.update({
                where: { id: orderId },
                data: {
                    status: client_1.OrderStatus.PAID,
                    confirmedAt: now,
                    agentId: actorId,
                    updatedAt: now,
                },
            }),
            this.prisma.pass.upsert({
                where: { userId: order.userId },
                create: {
                    userId: order.userId,
                    plan: order.plan,
                    startsAt: now,
                    endsAt,
                    tokenCap: cfg.tokenCap,
                    imageCap: cfg.imageCap,
                },
                update: {
                    plan: order.plan,
                    startsAt: now,
                    endsAt,
                    tokenCap: cfg.tokenCap,
                    imageCap: cfg.imageCap,
                    tokensUsed: 0,
                    imagesUsed: 0,
                },
            }),
            this.prisma.user.update({
                where: { id: order.userId },
                data: { onboarded: true },
            }),
        ]);
        await this.audit.log({
            userId: order.userId,
            actorId,
            action: client_1.AuditAction.ORDER_CONFIRMED,
            metadata: { orderId, plan: order.plan, amountSYP: cfg.amountSYP, reference },
        });
        await this.audit.log({
            userId: order.userId,
            actorId,
            action: client_1.AuditAction.PASS_ACTIVATED,
            metadata: { plan: order.plan, endsAt: endsAt.toISOString() },
        });
        this.email
            .sendPassActivated(order.user.email, order.plan, endsAt)
            .catch((err) => this.logger.error('Pass activation email failed', err));
        return { order: updatedOrder, pass };
    }
    async canConsume(userId, type, tokens, images = 0) {
        const pass = await this.prisma.pass.findUnique({ where: { userId } });
        if (!pass) {
            return { allowed: false, reason: 'NO_PASS', message: 'No active plan.' };
        }
        const now = new Date();
        if (pass.endsAt.getTime() <= now.getTime()) {
            return { allowed: false, reason: 'EXPIRED', message: 'Your plan expired. Please upgrade.' };
        }
        if (pass.plan === client_1.Plan.FREE) {
            const cap = billing_plans_1.PLAN_CONFIG.FREE.dailyTokenCap ?? 2000;
            const dayStart = startOfDayUTC(now);
            const agg = await this.prisma.usageLog.aggregate({
                where: { userId, type: client_1.UsageType.CHAT, createdAt: { gte: dayStart } },
                _sum: { tokens: true },
            });
            const used = agg._sum.tokens ?? 0;
            if (used + tokens > cap) {
                return {
                    allowed: false,
                    reason: 'DAILY_LIMIT',
                    message: `You’ve used today’s ${cap.toLocaleString()} tokens. Upgrade your plan to continue.`,
                };
            }
        }
        if (pass.tokenCap > 0 && pass.tokensUsed + tokens > pass.tokenCap) {
            return { allowed: false, reason: 'TOKEN_CAP', message: 'Token cap reached. Upgrade your plan.' };
        }
        if (pass.imageCap > 0 && pass.imagesUsed + images > pass.imageCap) {
            return { allowed: false, reason: 'IMAGE_CAP', message: 'Image cap reached. Upgrade your plan.' };
        }
        return { allowed: true, reason: null, message: 'ok' };
    }
    async consume(userId, type, tokens, images = 0, model) {
        const check = await this.canConsume(userId, type, tokens, images);
        if (!check.allowed) {
            throw new common_1.ForbiddenException(check.message);
        }
        await this.prisma.$transaction([
            this.prisma.usageLog.create({
                data: {
                    userId,
                    type,
                    model,
                    tokens,
                    images,
                },
            }),
            this.prisma.pass.update({
                where: { userId },
                data: {
                    tokensUsed: { increment: tokens },
                    imagesUsed: { increment: images },
                },
            }),
        ]);
        return { ok: true };
    }
};
exports.BillingService = BillingService;
exports.BillingService = BillingService = BillingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        email_service_1.EmailService])
], BillingService);
//# sourceMappingURL=billing.service.js.map