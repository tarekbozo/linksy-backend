import { Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { OrderStatus, Plan, Role } from "@prisma/client";
import { Roles } from "../auth/decorators";
import { AdminService } from "./admin.service";

@Controller("admin")
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get("stats")
  getStats() {
    return this.admin.getPlatformStats();
  }

  @Get("agents/breakdown")
  getAgentBreakdown(
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.admin.getAgentBreakdown(
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get("orders")
  listOrders(
    @Query("status") status?: string,
    @Query("agentId") agentId?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("plan") plan?: string,
    @Query("search") search?: string,
    @Query("skip") skip?: string,
    @Query("take") take?: string,
  ) {
    return this.admin.listOrders({
      status: status as OrderStatus | undefined,
      agentId: agentId || undefined,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      plan: plan as Plan | undefined,
      search: search || undefined,
      skip: skip ? +skip : 0,
      take: take ? +take : 20,
    });
  }

  @Post("agents/:agentId/settle")
  settleAgent(@Param("agentId") agentId: string) {
    return this.admin.settleAgentOrders(agentId);
  }

  @Patch("orders/:id/settle")
  settleOrder(@Param("id") id: string) {
    return this.admin.settleOrder(id);
  }
}
