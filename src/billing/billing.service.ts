import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import {
  ActionType,
  AuditAction,
  CreditType,
  OrderStatus,
  Plan,
  TransactionType,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { EmailService } from "../email/email.service";
import {
  PLAN_CONFIG,
  CREDIT_COST,
  PAID_PLANS,
  BASIC_MODELS,
} from "./billing.plans";

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly email: EmailService,
  ) {}

  // ── Plans ──────────────────────────────────────────────────────────────────

  listPlans() {
    return Object.entries(PLAN_CONFIG).map(([plan, cfg]) => ({ plan, ...cfg }));
  }

  // ── Balance ────────────────────────────────────────────────────────────────

  async getBalance(userId: string): Promise<number> {
    const sub = await this.prisma.userSubscription.findUnique({
      where: { userId },
    });

    if (!sub || sub.plan === Plan.FREE) {
      const free = await this.ensureFreeDailyCredit(userId);
      return Math.max(0, free.dailyCap - free.usedToday);
    }

    const now = new Date();
    const buckets = await this.prisma.userCredit.findMany({
      where: {
        userId,
        remaining: { gt: 0 },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    });

    return buckets.reduce((sum, b) => sum + b.remaining, 0);
  }

  async getStatus(userId: string) {
    const sub = await this.prisma.userSubscription.findUnique({
      where: { userId },
    });
    const plan = sub?.plan ?? Plan.FREE;
    const balance = await this.getBalance(userId);
    const cfg = PLAN_CONFIG[plan];

    return {
      plan,
      balance,
      features: cfg.features,
      expiresAt: sub?.expiresAt ?? null,
      upgradeRequired: balance <= 0,
    };
  }

  // ── Free daily credit helpers ──────────────────────────────────────────────

  private async ensureFreeDailyCredit(userId: string) {
    const now = new Date();
    const todayUTC = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    let record = await this.prisma.freeDailyCredit.findUnique({
      where: { userId },
    });

    if (!record) {
      record = await this.prisma.freeDailyCredit.create({
        data: { userId, lastResetAt: todayUTC, usedToday: 0, dailyCap: PLAN_CONFIG[Plan.FREE].credits },
      });
    } else if (record.lastResetAt < todayUTC) {
      record = await this.prisma.freeDailyCredit.update({
        where: { userId },
        data: { lastResetAt: todayUTC, usedToday: 0 },
      });
    }

    return record;
  }

  // ── canConsume ─────────────────────────────────────────────────────────────

  async canConsume(userId: string, action: ActionType, modelId?: string) {
    const cost = this.resolveCost(action, modelId);
    const sub = await this.prisma.userSubscription.findUnique({
      where: { userId },
    });
    const plan = sub?.plan ?? Plan.FREE;
    const cfg = PLAN_CONFIG[plan];

    // ── Feature gates ────────────────────────────────────────────────────────

    if (
      action === ActionType.VOICE_GENERATION &&
      !cfg.features.includes("voice_to_text")
    ) {
      return {
        allowed: false,
        reason: "FEATURE_LOCKED",
        message: "تحويل الصوت إلى نص متاح من باقة الطالب فأعلى.",
        cost,
      };
    }

    if (
      action === ActionType.IMAGE_GENERATION &&
      !cfg.features.includes("image_generation")
    ) {
      return {
        allowed: false,
        reason: "FEATURE_LOCKED",
        message: "توليد الصور يتطلب باقة المستقل أو المبدع.",
        cost,
      };
    }

    if (
      action === ActionType.ADVANCED_CHAT &&
      !cfg.features.includes("advanced_chat")
    ) {
      return {
        allowed: false,
        reason: "FEATURE_LOCKED",
        message: "المحادثة المتقدمة تتطلب باقة الطالب أو أعلى.",
        cost,
      };
    }

    // ── Monthly image cap (FREELANCER=30, CREATOR=100, others=0) ─────────────

    if (
      action === ActionType.IMAGE_GENERATION &&
      cfg.monthlyImageCap > 0
    ) {
      const startOfMonth = new Date();
      startOfMonth.setUTCDate(1);
      startOfMonth.setUTCHours(0, 0, 0, 0);

      const imagesThisMonth = await this.prisma.usageLog.count({
        where: {
          userId,
          type: "IMAGE" as any,
          createdAt: { gte: startOfMonth },
        },
      });

      if (imagesThisMonth >= cfg.monthlyImageCap) {
        return {
          allowed: false,
          reason: "IMAGE_CAP",
          message: `لقد وصلت للحد الأقصى من الصور هذا الشهر (${cfg.monthlyImageCap} صورة).`,
          cost,
        };
      }
    }

    // ── FREE daily limit ─────────────────────────────────────────────────────

    if (plan === Plan.FREE) {
      const free = await this.ensureFreeDailyCredit(userId);
      const remaining = free.dailyCap - free.usedToday;
      if (remaining < cost) {
        return {
          allowed: false,
          reason: "DAILY_LIMIT",
          message: `استهلكت رصيد اليوم المجاني (${free.dailyCap} رصيد). قم بالترقية للمتابعة.`,
          cost,
        };
      }
      return { allowed: true, reason: null, message: "ok", cost };
    }

    // ── Subscription expiry ──────────────────────────────────────────────────

    if (sub?.expiresAt && sub.expiresAt < new Date()) {
      return {
        allowed: false,
        reason: "EXPIRED",
        message: "انتهت صلاحية باقتك. يرجى التجديد.",
        cost,
      };
    }

    // ── Credit balance ───────────────────────────────────────────────────────

    const balance = await this.getBalance(userId);
    if (balance < cost) {
      return {
        allowed: false,
        reason: "NO_CREDITS",
        message: "رصيدك غير كافٍ. قم بشراء شحن إضافي أو ترقية باقتك.",
        cost,
      };
    }

    return { allowed: true, reason: null, message: "ok", cost };
  }

  // ── consume ────────────────────────────────────────────────────────────────

  async consume(
    userId: string,
    action: ActionType,
    modelId?: string,
    conversationId?: string,
  ) {
    const check = await this.canConsume(userId, action, modelId);
    if (!check.allowed) throw new ForbiddenException(check.message);

    const cost = check.cost;
    const sub = await this.prisma.userSubscription.findUnique({
      where: { userId },
    });
    const plan = sub?.plan ?? Plan.FREE;

    if (plan === Plan.FREE) {
      await this.prisma.freeDailyCredit.update({
        where: { userId },
        data: { usedToday: { increment: cost } },
      });

      const newBalance = await this.getBalance(userId);
      await this.prisma.creditTransaction.create({
        data: {
          userId,
          type: TransactionType.DEBIT,
          action,
          amount: cost,
          balanceAfter: newBalance,
          conversationId: conversationId ?? null,
          metadata: { model: modelId, plan: "FREE" },
        },
      });

      await this.prisma.usageLog.create({
        data: { userId, type: "CHAT", model: modelId, credits: cost },
      });

      return { ok: true, cost, balanceAfter: newBalance };
    }

    // Paid: deduct from buckets — SUBSCRIPTION first, then TOPUP by expiresAt ASC
    const now = new Date();
    const buckets = await this.prisma.userCredit.findMany({
      where: {
        userId,
        remaining: { gt: 0 },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: [{ type: "asc" }, { expiresAt: "asc" }],
    });

    let remaining = cost;
    const updates: Promise<any>[] = [];

    for (const bucket of buckets) {
      if (remaining <= 0) break;
      const deduct = Math.min(bucket.remaining, remaining);
      remaining -= deduct;
      updates.push(
        this.prisma.userCredit.update({
          where: { id: bucket.id },
          data: { remaining: { decrement: deduct } },
        }),
      );
    }

    await Promise.all(updates);

    const newBalance = await this.getBalance(userId);

    await this.prisma.creditTransaction.create({
      data: {
        userId,
        type: TransactionType.DEBIT,
        action,
        amount: cost,
        balanceAfter: newBalance,
        conversationId: conversationId ?? null,
        metadata: { model: modelId, plan },
      },
    });

    const usageType =
      action === ActionType.IMAGE_GENERATION
        ? "IMAGE"
        : action === ActionType.VOICE_GENERATION
          ? "VOICE"
          : "CHAT";

    await this.prisma.usageLog.create({
      data: { userId, type: usageType as any, model: modelId, credits: cost },
    });

    return { ok: true, cost, balanceAfter: newBalance };
  }

  // ── deductFixed ───────────────────────────────────────────────────────────
  // Deducts a pre-calculated fixed amount. Used by Study Mode so the chat
  // stream can be called afterwards without double-billing.

  async deductFixed(
    userId: string,
    credits: number,
    action: ActionType,
    metadata?: Record<string, unknown>,
  ): Promise<{ creditsDeducted: number; creditsRemaining: number }> {
    const balance = await this.getBalance(userId);
    if (balance < credits) {
      throw new BadRequestException("رصيد غير كافٍ لتنفيذ هذه العملية");
    }

    const sub = await this.prisma.userSubscription.findUnique({
      where: { userId },
    });
    const plan = sub?.plan ?? Plan.FREE;

    if (plan === Plan.FREE) {
      await this.prisma.freeDailyCredit.update({
        where: { userId },
        data: { usedToday: { increment: credits } },
      });
    } else {
      const now = new Date();
      const buckets = await this.prisma.userCredit.findMany({
        where: {
          userId,
          remaining: { gt: 0 },
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        orderBy: [{ type: "asc" }, { expiresAt: "asc" }],
      });

      let remaining = credits;
      const updates: Promise<any>[] = [];
      for (const bucket of buckets) {
        if (remaining <= 0) break;
        const deduct = Math.min(bucket.remaining, remaining);
        remaining -= deduct;
        updates.push(
          this.prisma.userCredit.update({
            where: { id: bucket.id },
            data: { remaining: { decrement: deduct } },
          }),
        );
      }
      await Promise.all(updates);
    }

    const newBalance = await this.getBalance(userId);

    await this.prisma.creditTransaction.create({
      data: {
        userId,
        type: TransactionType.DEBIT,
        action,
        amount: credits,
        balanceAfter: newBalance,
        metadata: { ...metadata, plan },
      },
    });

    const usageType =
      action === ActionType.IMAGE_GENERATION
        ? "IMAGE"
        : action === ActionType.VOICE_GENERATION
          ? "VOICE"
          : "CHAT";

    await this.prisma.usageLog.create({
      data: { userId, type: usageType as any, credits },
    });

    return { creditsDeducted: credits, creditsRemaining: newBalance };
  }

  // ── resolveCost ────────────────────────────────────────────────────────────

  resolveCost(action: ActionType, modelId?: string): number {
    if (action === ActionType.BASIC_CHAT) return CREDIT_COST.BASIC_CHAT;
    if (action === ActionType.ADVANCED_CHAT) return CREDIT_COST.ADVANCED_CHAT;
    if (action === ActionType.IMAGE_GENERATION)
      return CREDIT_COST.IMAGE_GENERATION;
    if (action === ActionType.VOICE_GENERATION)
      return CREDIT_COST.VOICE_GENERATION;
    if (action === ActionType.VIDEO_GENERATION)
      return CREDIT_COST.VIDEO_GENERATION;
    return 1;
  }

  resolveAction(modelId: string): ActionType {
    if (BASIC_MODELS.includes(modelId)) return ActionType.BASIC_CHAT;
    return ActionType.ADVANCED_CHAT;
  }

  // ── selectPlan ────────────────────────────────────────────────────────────

  async selectPlan(userId: string, plan: Plan) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    const cfg = PLAN_CONFIG[plan];
    if (!cfg) throw new BadRequestException("Unknown plan");

    if (plan === Plan.FREE) {
      // Prevent downgrade from paid plan
      const existing = await this.prisma.userSubscription.findUnique({
        where: { userId },
      });
      if (existing && existing.plan !== Plan.FREE) {
        throw new ForbiddenException(
          "لا يمكن التحويل إلى الباقة المجانية وأنت على باقة مدفوعة",
        );
      }
      await this.ensureFreeDailyCredit(userId);
      await this.prisma.userSubscription.upsert({
        where: { userId },
        create: { userId, plan: Plan.FREE },
        update: { plan: Plan.FREE, expiresAt: null, activatedAt: null },
      });
      await this.prisma.user.update({
        where: { id: userId },
        data: { onboarded: true },
      });
      return { mode: "activated" as const };
    }

    if (!PAID_PLANS.includes(plan))
      throw new BadRequestException("Invalid plan");

    const order = await this.prisma.order.create({
      data: {
        userId,
        plan,
        priceSYP: cfg.priceSYP,
        status: OrderStatus.PENDING,
      },
    });

    await this.audit.log({
      userId,
      action: AuditAction.PASS_CREATED,
      metadata: { plan, orderId: order.id, priceSYP: cfg.priceSYP },
    });

    return { mode: "order" as const, order };
  }

  // ── purchaseTopUp ─────────────────────────────────────────────────────────

  async purchaseTopUp(userId: string, topUpPackId: string) {
    const pack = await this.prisma.topUpPack.findUnique({
      where: { id: topUpPackId },
    });
    if (!pack || !pack.active)
      throw new NotFoundException("Top-up pack not found");

    const order = await this.prisma.order.create({
      data: {
        userId,
        topUpPackId,
        priceSYP: pack.priceSYP,
        status: OrderStatus.PENDING,
      },
    });

    return { mode: "order" as const, order };
  }

  // ── confirmOrder ──────────────────────────────────────────────────────────

  async confirmOrder(actorId: string, orderId: string, reference?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { email: true } }, topUpPack: true },
    });
    if (!order) throw new NotFoundException("Order not found");
    if (order.status !== OrderStatus.PENDING)
      throw new BadRequestException("Order is not pending");

    const now = new Date();

    if (order.plan) {
      const cfg = PLAN_CONFIG[order.plan];
      const expiresAt = new Date(
        now.getTime() + cfg.durationDays * 24 * 60 * 60 * 1000,
      );

      await this.prisma.$transaction([
        // Expire any existing SUBSCRIPTION bucket so old plan credits don't stack
        this.prisma.userCredit.updateMany({
          where: {
            userId: order.userId,
            type: CreditType.SUBSCRIPTION,
            remaining: { gt: 0 },
          },
          data: { remaining: 0, expiresAt: now },
        }),
        this.prisma.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.CONFIRMED,
            confirmedAt: now,
            confirmedBy: actorId,
          },
        }),
        this.prisma.userSubscription.upsert({
          where: { userId: order.userId },
          create: {
            userId: order.userId,
            plan: order.plan,
            activatedAt: now,
            expiresAt,
          },
          update: { plan: order.plan, activatedAt: now, expiresAt },
        }),
        this.prisma.userCredit.create({
          data: {
            userId: order.userId,
            type: CreditType.SUBSCRIPTION,
            amount: cfg.credits,
            remaining: cfg.credits,
            expiresAt,
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
        action: AuditAction.PLAN_ACTIVATED,
        metadata: { plan: order.plan, orderId, expiresAt, reference },
      });

      this.email
        .sendPassActivated(order.user.email, order.plan, expiresAt)
        .catch((err) => this.logger.error("Activation email failed", err));

      return { ok: true, type: "plan", plan: order.plan };
    }

    if (order.topUpPackId && order.topUpPack) {
      const pack = order.topUpPack;
      const expiresAt = new Date(
        now.getTime() + pack.validDays * 24 * 60 * 60 * 1000,
      );

      await this.prisma.$transaction([
        this.prisma.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.CONFIRMED,
            confirmedAt: now,
            confirmedBy: actorId,
          },
        }),
        this.prisma.userCredit.create({
          data: {
            userId: order.userId,
            type: CreditType.TOPUP,
            amount: pack.credits,
            remaining: pack.credits,
            expiresAt,
          },
        }),
      ]);

      await this.audit.log({
        userId: order.userId,
        actorId,
        action: AuditAction.TOPUP_PURCHASED,
        metadata: {
          packId: pack.id,
          credits: pack.credits,
          orderId,
          reference,
        },
      });

      return { ok: true, type: "topup", credits: pack.credits };
    }

    throw new BadRequestException("Order has neither plan nor top-up pack");
  }

  // ── rejectOrder ───────────────────────────────────────────────────────────

  async rejectOrder(actorId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException("Order not found");
    if (order.status !== OrderStatus.PENDING)
      throw new BadRequestException("Order is not pending");

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.REJECTED,
        confirmedAt: new Date(),
        confirmedBy: actorId,
      },
    });

    await this.audit.log({
      userId: order.userId,
      actorId,
      action: AuditAction.ORDER_REJECTED,
      metadata: { orderId },
    });

    return { ok: true };
  }

  // ── getOrderById ──────────────────────────────────────────────────────────

  async getOrderById(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, email: true } },
        topUpPack: true,
      },
    });
    if (!order) throw new NotFoundException("Order not found");
    return order;
  }

  // ── listTopUpPacks ────────────────────────────────────────────────────────

  async listTopUpPacks() {
    return this.prisma.topUpPack.findMany({ where: { active: true } });
  }

  // ── getActivity ───────────────────────────────────────────────────────────

  async getActivity(userId: string, take = 50) {
    return this.prisma.usageLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        type: true,
        model: true,
        credits: true,
        createdAt: true,
      },
    });
  }
}
