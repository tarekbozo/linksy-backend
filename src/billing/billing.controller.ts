import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { Plan, Role } from "@prisma/client";
import { BillingService } from "./billing.service";
import { SelectPlanDto } from "./dto/select-plan.dto";
import { ConfirmOrderDto } from "./dto/confirm-order.dto";
import { AuthUser, CurrentUser, Roles } from "src/auth/decorators";
import { SkipThrottle } from "@nestjs/throttler";
import { PurchaseTopUpDto } from "./dto/purchase-topup.dto";

@Controller("billing")
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get("plans")
  listPlans() {
    return this.billing.listPlans();
  }

  @Get("topups")
  listTopUps() {
    return this.billing.listTopUpPacks();
  }

  @SkipThrottle()
  @Get("status")
  status(@CurrentUser() user: AuthUser) {
    return this.billing.getStatus(user.id);
  }

  @SkipThrottle()
  @Get("balance")
  balance(@CurrentUser() user: AuthUser) {
    return this.billing.getBalance(user.id);
  }

  @Post("select")
  select(@CurrentUser() user: AuthUser, @Body() dto: SelectPlanDto) {
    return this.billing.selectPlan(user.id, dto.plan as Plan);
  }

  @Post("topup")
  purchaseTopUp(@CurrentUser() user: AuthUser, @Body() dto: PurchaseTopUpDto) {
    return this.billing.purchaseTopUp(user.id, dto.topUpPackId);
  }

  @Get("orders/:id")
  @Roles(Role.ADMIN, Role.AGENT)
  getOrder(@Param("id") id: string) {
    return this.billing.getOrderById(id);
  }

  @Post("orders/:id/confirm")
  @Roles(Role.ADMIN, Role.AGENT)
  confirmOrder(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: ConfirmOrderDto,
  ) {
    return this.billing.confirmOrder(user.id, id, dto.reference);
  }

  @Post("orders/:id/reject")
  @Roles(Role.ADMIN, Role.AGENT)
  rejectOrder(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.billing.rejectOrder(user.id, id);
  }

  @SkipThrottle()
  @Get("activity")
  getActivity(@CurrentUser() user: AuthUser, @Query("take") take = "50") {
    return this.billing.getActivity(user.id, +take);
  }
}
