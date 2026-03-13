import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { AuditAction, OrderStatus, Plan, UsageType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { PLAN_CONFIG, PAID_PLANS } from "./billing.plans";
import { EmailService } from "src/email/email.service";

function startOfDayUTC(d = new Date()) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

function addDays(d: Date, days: number) {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly email: EmailService,
  ) {}

  listPlans() {
    return Object.entries(PLAN_CONFIG).map(([plan, cfg]) => ({
      plan,
      ...cfg,
    }));
  }

  async getMyPass(userId: string) {
    return this.prisma.pass.findUnique({ where: { userId } });
  }

  /**
   * Returns a status object that the frontend can use to show reminders
   * like: "You've used today's 2,000 tokens. Upgrade your plan."
   */
  async getUsageStatus(userId: string) {
    const pass = await this.prisma.pass.findUnique({ where: { userId } });
    if (!pass) {
      return {
        hasPass: false,
        plan: null,
        onboarded: false,
        upgradeRequired: true,
        message: "No active pass. Please select a plan.",
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { onboarded: true },
    });

    const now = new Date();
    const expired = pass.endsAt.getTime() <= now.getTime();

    // Daily cap only for FREE.
    let daily = null as null | { cap: number; used: number; remaining: number };
    if (pass.plan === Plan.FREE) {
      const cap = PLAN_CONFIG.FREE.dailyTokenCap ?? 3000;
      const dayStart = startOfDayUTC(now);
      const agg = await this.prisma.usageLog.aggregate({
        where: {
          userId,
          type: UsageType.CHAT,
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

    const tokenCapExceeded =
      pass.plan !== Plan.FREE &&
      pass.tokenCap > 0 && pass.tokensUsed >= pass.tokenCap;
    const imageCapExceeded =
      pass.imageCap > 0 && pass.imagesUsed >= pass.imageCap;

    const blocked =
      expired ||
      tokenCapExceeded ||
      imageCapExceeded ||
      (daily ? daily.remaining <= 0 : false);

    const message = expired
      ? "Your pass expired. Please upgrade your plan."
      : daily && daily.remaining <= 0
        ? `You’ve used today’s ${daily.cap.toLocaleString()} tokens. Upgrade your plan to continue.`
        : tokenCapExceeded
          ? "You reached your token cap. Upgrade your plan to continue."
          : imageCapExceeded
            ? "You reached your image cap. Upgrade your plan to continue."
            : "ok";

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

  /**
   * Selects a plan.
   * - FREE: activates immediately but only ONCE per email/user.
   * - Paid: creates a PENDING order; activation happens on confirm.
   */
  async selectPlan(userId: string, plan: Plan) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    const cfg = PLAN_CONFIG[plan];
    if (!cfg) throw new BadRequestException("Unknown plan");

    if (plan === Plan.FREE) {
      // One-time FREE per email/user.
      // Since email is unique per user, this blocks "same email forever free".
      // New emails are a different user and cannot be perfectly prevented without additional verification.
      const alreadyHadFree = await this.prisma.auditLog.findFirst({
        where: {
          userId,
          action: AuditAction.PASS_ACTIVATED,
          metadata: { path: ["plan"], equals: "FREE" },
        },
      });

      if (alreadyHadFree) {
        throw new ForbiddenException(
          "Free plan can only be claimed once per email.",
        );
      }

      const now = new Date();
      const endsAt = addDays(now, cfg.durationDays);

      const pass = await this.prisma.pass.upsert({
      where: { userId },
      create: {
        userId,
        plan: Plan.FREE,
        startsAt: now,
        endsAt,
        tokenCap: cfg.tokenCap,
        imageCap: cfg.imageCap,
      },
      update: {
        plan: Plan.FREE,
        startsAt: now,
        endsAt,
        tokenCap: cfg.tokenCap,
        imageCap: cfg.imageCap,
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
        action: AuditAction.PASS_ACTIVATED,
        metadata: { plan: "FREE", endsAt: endsAt.toISOString() },
      });

      return { mode: "activated" as const, pass };
    }

    if (!PAID_PLANS.includes(plan)) {
      throw new BadRequestException("Invalid paid plan");
    }

    // Create a pending order. Activation happens on confirm.
    const order = await this.prisma.order.create({
      data: {
        userId,
        plan,
        amountSYP: cfg.amountSYP,
        status: OrderStatus.PENDING,
      },
    });

    await this.audit.log({
      userId,
      action: AuditAction.PASS_CREATED,
      metadata: { plan, orderId: order.id, amountSYP: cfg.amountSYP },
    });

    return { mode: "order" as const, order };
  }
  async getOrderById(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, email: true } },
        agent: { select: { id: true, email: true } },
      },
    });
    if (!order) throw new NotFoundException("Order not found.");
    return order;
  }

  /**
   * Get recent usage activity for a user — used by dashboard overview.
   */
  async getActivity(userId: string, take = 10) {
    return this.prisma.usageLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
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

  /**
   * Confirms an order and activates the pass.
   * Intended for AGENT/ADMIN workflows.
   */
  async confirmOrder(actorId: string, orderId: string, reference?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { email: true } } }, // ← include user email
    });
    if (!order) throw new NotFoundException("Order not found");

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException("Order is not pending");
    }

    const cfg = PLAN_CONFIG[order.plan];
    if (!cfg) throw new BadRequestException("Unknown plan");

    const now = new Date();
    const endsAt = addDays(now, cfg.durationDays);

    const [updatedOrder, pass] = await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PAID,
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
      action: AuditAction.ORDER_CONFIRMED,
      metadata: {
        orderId,
        plan: order.plan,
        amountSYP: cfg.amountSYP,
        reference,
      },
    });

    await this.audit.log({
      userId: order.userId,
      actorId,
      action: AuditAction.PASS_ACTIVATED,
      metadata: { plan: order.plan, endsAt: endsAt.toISOString() },
    });

    // ── Send activation email — fire and forget, never blocks ──
    this.email
      .sendPassActivated(order.user.email, order.plan, endsAt)
      .catch((err) => this.logger.error("Pass activation email failed", err));

    return { order: updatedOrder, pass };
  }
  /**
   * Checks if a user can spend tokens/images right now.
   */
  async canConsume(
    userId: string,
    type: UsageType,
    tokens: number,
    images = 0,
  ) {
    const pass = await this.prisma.pass.findUnique({ where: { userId } });
    if (!pass) {
      return { allowed: false, reason: "NO_PASS", message: "No active plan." };
    }

    const now = new Date();
    if (pass.endsAt.getTime() <= now.getTime()) {
      return {
        allowed: false,
        reason: "EXPIRED",
        message: "Your plan expired. Please upgrade.",
      };
    }

    if (pass.plan === Plan.FREE) {
      const cap = PLAN_CONFIG.FREE.dailyTokenCap ?? 3000;
      const dayStart = startOfDayUTC(now);
      const agg = await this.prisma.usageLog.aggregate({
        where: { userId, type: UsageType.CHAT, createdAt: { gte: dayStart } },
        _sum: { tokens: true },
      });
      const used = agg._sum.tokens ?? 0;
      if (used >= cap) {
        return {
          allowed: false,
          reason: "DAILY_LIMIT",
          message: `You’ve used today’s ${cap.toLocaleString()} tokens. Upgrade your plan to continue.`,
        };
      }
    }

    if (pass.tokenCap > 0 && pass.tokensUsed >= pass.tokenCap) {
      return {
        allowed: false,
        reason: "TOKEN_CAP",
        message: "Token cap reached. Upgrade your plan.",
      };
    }

    if (pass.imageCap > 0 && pass.imagesUsed + images > pass.imageCap) {
      return {
        allowed: false,
        reason: "IMAGE_CAP",
        message: "Image cap reached. Upgrade your plan.",
      };
    }

    return { allowed: true, reason: null, message: "ok" };
  }

  /**
   * Records usage and increments counters.
   * Call this after a successful response.
   */
  async consume(
    userId: string,
    type: UsageType,
    tokens: number,
    images = 0,
    model?: string,
  ) {
    const check = await this.canConsume(userId, type, tokens, images);
    if (!check.allowed) {
      throw new ForbiddenException(check.message);
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
}
