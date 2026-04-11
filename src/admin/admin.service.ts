import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { OrderStatus, Plan, Role } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Platform-wide stats ───────────────────────────────────────────────────

  async getPlatformStats() {
    const [totalRevenue, unsettledRevenue, confirmedCount, pendingCount, activeAgentsCount] =
      await Promise.all([
        this.prisma.order.aggregate({
          where: { status: OrderStatus.CONFIRMED },
          _sum: { priceSYP: true },
        }),
        this.prisma.order.aggregate({
          where: { status: OrderStatus.CONFIRMED, settledAt: null },
          _sum: { priceSYP: true },
        }),
        this.prisma.order.count({ where: { status: OrderStatus.CONFIRMED } }),
        this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
        this.prisma.user.count({ where: { role: Role.AGENT, isActive: true } }),
      ]);

    return {
      totalRevenueSYP: totalRevenue._sum?.priceSYP ?? 0,
      unsettledRevenueSYP: unsettledRevenue._sum?.priceSYP ?? 0,
      confirmedOrdersCount: confirmedCount,
      pendingOrdersCount: pendingCount,
      activeAgentsCount,
    };
  }

  // ── Per-agent breakdown ───────────────────────────────────────────────────
  // confirmedCount/totalCollectedSYP respect the date filter.
  // unsettledSYP/unsettledCount are always all-time (what is owed regardless of period).

  async getAgentBreakdown(from?: Date, to?: Date) {
    const periodFilter =
      from || to
        ? {
            confirmedAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {};

    const [confirmed, unsettled, agents] = await Promise.all([
      this.prisma.order.groupBy({
        by: ["confirmedBy"],
        where: {
          status: OrderStatus.CONFIRMED,
          confirmedBy: { not: null },
          ...periodFilter,
        },
        _sum: { priceSYP: true },
        _count: { _all: true },
        _max: { confirmedAt: true },
      }),
      this.prisma.order.groupBy({
        by: ["confirmedBy"],
        where: {
          status: OrderStatus.CONFIRMED,
          settledAt: null,
          confirmedBy: { not: null },
        },
        _sum: { priceSYP: true },
        _count: { _all: true },
      }),
      this.prisma.user.findMany({
        where: { role: Role.AGENT },
        select: { id: true, email: true, isActive: true },
        orderBy: { email: "asc" },
      }),
    ]);

    const confirmedMap = new Map(
      confirmed.map((c) => [c.confirmedBy as string, c]),
    );
    const unsettledMap = new Map(
      unsettled.map((u) => [u.confirmedBy as string, u]),
    );

    return agents.map((agent) => ({
      id: agent.id,
      email: agent.email,
      isActive: agent.isActive,
      confirmedCount: confirmedMap.get(agent.id)?._count?._all ?? 0,
      totalCollectedSYP: confirmedMap.get(agent.id)?._sum?.priceSYP ?? 0,
      unsettledSYP: unsettledMap.get(agent.id)?._sum?.priceSYP ?? 0,
      unsettledCount: (unsettledMap.get(agent.id)?._count as { _all?: number } | undefined)?._all ?? 0,
      lastActivityAt:
        confirmedMap.get(agent.id)?._max?.confirmedAt ?? null,
    }));
  }

  // ── Paginated orders list with filters ────────────────────────────────────

  async listOrders(params: {
    status?: OrderStatus;
    agentId?: string;
    from?: Date;
    to?: Date;
    plan?: Plan;
    search?: string;
    skip?: number;
    take?: number;
  }) {
    const { status, agentId, from, to, plan, search, skip = 0, take = 20 } =
      params;

    const where: any = {};
    if (status) where.status = status;
    if (agentId) where.confirmedBy = agentId;
    if (plan) where.plan = plan;
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      };
    }
    if (search) {
      where.OR = [
        { id: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, email: true } },
          confirmer: { select: { id: true, email: true } },
          topUpPack: { select: { nameAr: true, credits: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { orders, total, skip, take };
  }

  // ── Settle all unsettled confirmed orders for one agent ───────────────────

  async settleAgentOrders(agentId: string) {
    const agent = await this.prisma.user.findUnique({
      where: { id: agentId },
      select: { id: true, role: true },
    });
    if (!agent || agent.role !== Role.AGENT) {
      throw new NotFoundException("Agent not found");
    }

    const result = await this.prisma.order.updateMany({
      where: {
        confirmedBy: agentId,
        status: OrderStatus.CONFIRMED,
        settledAt: null,
      },
      data: { settledAt: new Date() },
    });

    return { settledCount: result.count };
  }

  // ── Settle a single order ─────────────────────────────────────────────────

  async settleOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException("Order not found");
    if (order.status !== OrderStatus.CONFIRMED) {
      throw new BadRequestException("Only confirmed orders can be settled");
    }
    if (order.settledAt) {
      throw new BadRequestException("Order is already settled");
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { settledAt: new Date() },
      select: { id: true, settledAt: true },
    });
  }
}
