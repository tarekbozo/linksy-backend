import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { Strategy } from "passport-jwt";
import { Request } from "express";
import { JwtPayload } from "./types/jwt-payload.type";
import { AuthService } from "./auth.service";

function extractFromCookieOrBearer(req: Request): string | null {
  if (req?.cookies?.access_token) return req.cookies.access_token;
  const authHeader = req?.headers?.authorization;
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: extractFromCookieOrBearer,
      ignoreExpiration: false,
      secretOrKey: config.get<string>("JWT_ACCESS_SECRET")!,
    });
  }

  async validate(payload: JwtPayload) {
    console.log("JWT payload received:", payload);
    const user = await this.authService.validateSession(
      payload.sid,
      payload.sub,
    );
    if (!user.isActive) throw new UnauthorizedException("Account deactivated.");
    return user;
  }
}
