import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { Plan, Role, UsageType } from "@prisma/client";
import { BillingService } from "./billing.service";
import { SelectPlanDto } from "./dto/select-plan.dto";
import { UsageCheckDto } from "./dto/usage.dto";
import { ConfirmOrderDto } from "./dto/confirm-order.dto";
import { AuthUser, CurrentUser, Roles } from "src/auth/decorators";
import { SkipThrottle } from "@nestjs/throttler";

// Use your existing decorators/guards.
// In your project, JwtAuthGuard is global, so these routes are already protected.

@Controller("billing")
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get("plans")
  listPlans() {
    return this.billing.listPlans();
  }
  @SkipThrottle()
  @Get("pass")
  myPass(@CurrentUser() user: AuthUser) {
    return this.billing.getMyPass(user.id);
  }

  @SkipThrottle()
  @Get("status")
  status(@CurrentUser() user: AuthUser) {
    return this.billing.getUsageStatus(user.id);
  }

  @Patch("select")
  select(@CurrentUser() user: AuthUser, @Body() dto: SelectPlanDto) {
    return this.billing.selectPlan(user.id, dto.plan as Plan);
  }
  @Get("orders/:id")
  @Roles(Role.ADMIN, Role.AGENT)
  getOrder(@Param("id") id: string) {
    return this.billing.getOrderById(id);
  }

  @Get("activity")
  getActivity(@CurrentUser() user: AuthUser, @Query("take") take = "10") {
    return this.billing.getActivity(user.id, +take);
  }
  /**
   * Confirm an order (agent/admin flow).
   */
  @Post("orders/:id/confirm")
  @Roles(Role.ADMIN, Role.AGENT)
  confirmOrder(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: ConfirmOrderDto,
  ) {
    return this.billing.confirmOrder(user.id, id, dto.reference);
  }

  /**
   * Check usage allowance without consuming.
   */
  @Post("usage/check")
  async check(@CurrentUser() user: AuthUser, @Body() dto: UsageCheckDto) {
    return this.billing.canConsume(
      user.id,
      dto.type as UsageType,
      dto.tokens,
      dto.images ?? 0,
    );
  }

  /**
   * Consume usage (write usage log + increment counters).
   */
  @Post("usage/consume")
  async consume(@CurrentUser() user: AuthUser, @Body() dto: UsageCheckDto) {
    return this.billing.consume(
      user.id,
      dto.type as UsageType,
      dto.tokens,
      dto.images ?? 0,
      dto.model,
    );
  }
}
