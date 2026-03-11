import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AuditAction, Role } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ─── Admin: list all users ───────────────────────────────────────────────
  async findAll(params: {
    role?: Role;
    search?: string;
    skip?: number;
    take?: number;
  }) {
    const { role, search, skip = 0, take = 50 } = params;
    const where: any = {};
    if (role) where.role = role;
    if (search) where.email = { contains: search, mode: "insensitive" };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
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

  // ─── Admin: get single user ──────────────────────────────────────────────
  async findOne(id: string) {
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
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        auditLogs: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: { action: true, metadata: true, createdAt: true },
        },
      },
    });
    if (!user) throw new NotFoundException("User not found.");
    return user;
  }

  // ─── Admin: change role ──────────────────────────────────────────────────
  async setRole(targetId: string, role: Role, actorId: string) {
    if (targetId === actorId)
      throw new BadRequestException("You cannot change your own role.");

    const target = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, role: true },
    });
    if (!target) throw new NotFoundException("User not found.");

    const user = await this.prisma.user.update({
      where: { id: targetId },
      data: { role },
      select: { id: true, email: true, role: true },
    });

    await this.audit.log({
      userId: targetId,
      actorId,
      action: AuditAction.ROLE_CHANGED,
      metadata: { from: target.role, to: role },
    });

    return user;
  }

  // ─── Admin: deactivate / reactivate ─────────────────────────────────────
  async setActive(targetId: string, isActive: boolean, actorId: string) {
    if (targetId === actorId)
      throw new BadRequestException("You cannot deactivate yourself.");

    const user = await this.prisma.user.update({
      where: { id: targetId },
      data: { isActive },
      select: { id: true, email: true, isActive: true },
    });

    await this.audit.log({
      userId: targetId,
      actorId,
      action: AuditAction.USER_DEACTIVATED,
      metadata: { isActive },
    });

    return user;
  }

  // ─── Agent: get order by ID to confirm ──────────────────────────────────
  async getOrderById(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { id: true, email: true } } },
    });
    if (!order) throw new NotFoundException("Order not found.");
    return order;
  }

  // ─── Agent: get pending orders + their own confirmed orders ─────────────
  async getAgentOrders(agentId: string) {
    return this.prisma.order.findMany({
      where: {
        OR: [{ agentId, status: "PAID" }, { status: "PENDING" }],
      },
      include: { user: { select: { id: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  // ─── Agent: stats ────────────────────────────────────────────────────────
  async getAgentStats(agentId: string) {
    const [confirmed, pending, totalSYP] = await Promise.all([
      this.prisma.order.count({ where: { agentId, status: "PAID" } }),
      this.prisma.order.count({ where: { status: "PENDING" } }),
      this.prisma.order.aggregate({
        where: { agentId, status: "PAID" },
        _sum: { amountSYP: true },
      }),
    ]);

    return {
      confirmedOrders: confirmed,
      pendingOrders: pending,
      totalCollectedSYP: totalSYP._sum.amountSYP ?? 0,
    };
  }
}
