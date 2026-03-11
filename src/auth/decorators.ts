import {
  SetMetadata,
  createParamDecorator,
  ExecutionContext,
} from "@nestjs/common";
import { Role } from "@prisma/client";

export const ROLES_KEY = "roles";
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  onboarded: boolean;
};

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthUser => {
    return ctx.switchToHttp().getRequest().user;
  },
);

export const IpAddress = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest();
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
    return req.socket?.remoteAddress ?? "unknown";
  },
);

export const UserAgent = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string => {
    return ctx.switchToHttp().getRequest().headers["user-agent"] ?? "unknown";
  },
);
