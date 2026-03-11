import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Role } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles, CurrentUser, AuthUser } from "../auth/decorators";
import { ListUsersDto } from "./dto/ListUsersDto";
import { UsersService } from "./users.service";
import { SetRoleDto } from "./dto/SetRoleDto";
import { SetActiveDto } from "./dto/SetActiveDto";
import { RolesGuard } from "src/auth/roles.guard";

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // ─── ADMIN: list all users ───────────────────────────────────────────────
  @Get()
  @Roles(Role.ADMIN)
  findAll(@Query() query: ListUsersDto) {
    return this.users.findAll({
      role: query.role,
      search: query.search,
      skip: query.skip ? Number(query.skip) : 0,
      take: query.take ? Number(query.take) : 50,
    });
  }

  // ─── ADMIN: get single user ──────────────────────────────────────────────
  @Get(":id")
  @Roles(Role.ADMIN)
  findOne(@Param("id") id: string) {
    return this.users.findOne(id);
  }

  // ─── ADMIN: change role ──────────────────────────────────────────────────
  @Patch(":id/role")
  @Roles(Role.ADMIN)
  setRole(
    @Param("id") id: string,
    @Body() dto: SetRoleDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.users.setRole(id, dto.role, actor.id);
  }

  // ─── ADMIN: deactivate / reactivate ─────────────────────────────────────
  @Patch(":id/active")
  @Roles(Role.ADMIN)
  setActive(
    @Param("id") id: string,
    @Body() dto: SetActiveDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.users.setActive(id, dto.isActive, actor.id);
  }

  // ─── AGENT + ADMIN: get order by id (to confirm) ────────────────────────
  @Get("agent/order/:orderId")
  @Roles(Role.ADMIN, Role.AGENT)
  getOrderById(@Param("orderId") orderId: string) {
    return this.users.getOrderById(orderId);
  }

  // ─── AGENT + ADMIN: list orders ─────────────────────────────────────────
  @Get("agent/orders")
  @Roles(Role.ADMIN, Role.AGENT)
  getAgentOrders(@CurrentUser() agent: AuthUser) {
    return this.users.getAgentOrders(agent.id);
  }

  // ─── AGENT + ADMIN: stats ────────────────────────────────────────────────
  @Get("agent/stats")
  @Roles(Role.ADMIN, Role.AGENT)
  getAgentStats(@CurrentUser() agent: AuthUser) {
    return this.users.getAgentStats(agent.id);
  }
}
