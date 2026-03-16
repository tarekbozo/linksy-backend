import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request, Response } from "express";
import { SkipThrottle, Throttle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import { clearAuthCookies, setAuthCookies } from "./cookie.config";
import { issueCsrfToken } from "../common/middleware/csrf.middleware";
import { JwtAuthGuard } from "./jwt-auth.guard";
import {
  AuthUser,
  CurrentUser,
  IpAddress,
  Public,
  UserAgent,
} from "./decorators";
import {
  MagicRequestDto,
  MagicVerifyDto,
  RefreshTokenDto,
} from "./dto/auth.dto";
import type { OAuthProfile } from "./strategies/oauth.strategies";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Get("csrf")
  @HttpCode(HttpStatus.OK)
  getCsrf(@Res({ passthrough: true }) res: Response) {
    const csrfToken = issueCsrfToken(res);
    return { csrfToken };
  }

  @Public()
  @Post("magic/request")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  async magicRequest(
    @Body() dto: MagicRequestDto,
    @IpAddress() ip: string,
    @UserAgent() userAgent: string,
  ) {
    return this.auth.requestMagicLink(dto.email, { ip, userAgent });
  }

  @Public()
  @Post("magic/verify")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async magicVerify(
    @Body() dto: MagicVerifyDto,
    @Res({ passthrough: true }) res: Response,
    @IpAddress() ip: string,
    @UserAgent() userAgent: string,
  ) {
    const result = await this.auth.verifyMagicLink(dto.email, dto.token, {
      ip,
      userAgent,
    });
    setAuthCookies(res, result.accessToken, result.refreshToken);
    issueCsrfToken(res);
    return { user: result.user };
  }

  @Public()
  @Get("google")
  @UseGuards(AuthGuard("google"))
  googleLogin() {}

  @Public()
  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  async googleCallback(
    @Req() req: Request & { user: OAuthProfile },
    @Res() res: Response,
    @IpAddress() ip: string,
    @UserAgent() userAgent: string,
  ) {
    const result = await this.auth.handleOAuth(req.user, { ip, userAgent });
    setAuthCookies(res, result.accessToken, result.refreshToken);
    issueCsrfToken(res);
    const webUrl = process.env.WEB_URL ?? "http://localhost:3000";
    let redirectUrl: string;
    if (result.user.role === "AGENT") {
      redirectUrl = `${webUrl}/agent-portal`;
    } else {
      redirectUrl = result.user.onboarded
        ? `${webUrl}/dashboard/ai-studio`
        : `${webUrl}/onboarding`;
    }
    return res.redirect(redirectUrl);
  }

  @Public()
  @Get("github")
  @UseGuards(AuthGuard("github"))
  githubLogin() {}

  @Public()
  @Get("github/callback")
  @UseGuards(AuthGuard("github"))
  async githubCallback(
    @Req() req: Request & { user: OAuthProfile },
    @Res() res: Response,
    @IpAddress() ip: string,
    @UserAgent() userAgent: string,
  ) {
    const result = await this.auth.handleOAuth(req.user, { ip, userAgent });
    setAuthCookies(res, result.accessToken, result.refreshToken);
    issueCsrfToken(res);
    const webUrl = process.env.WEB_URL ?? "http://localhost:3000";
    const redirectUrl = result.user.onboarded
      ? `${webUrl}/dashboard/ai-studio`
      : `${webUrl}/onboarding`;
    return res.redirect(redirectUrl);
  }
  @SkipThrottle()
  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @IpAddress() ip: string,
    @UserAgent() userAgent: string,
  ) {
    const token =
      req.cookies?.refresh_token ?? (req.body as RefreshTokenDto)?.refreshToken;
    if (!token) {
      res
        .status(HttpStatus.UNAUTHORIZED)
        .json({ message: "No refresh token." });
      return;
    }
    const result = await this.auth.refreshTokens(token, { ip, userAgent });
    setAuthCookies(res, result.accessToken, result.refreshToken);
    issueCsrfToken(res);
    return { user: result.user };
  }

  @Get("sessions")
  @UseGuards(JwtAuthGuard)
  getSessions(@CurrentUser() user: AuthUser) {
    return this.auth.getSessions(user.id);
  }

  @Delete("sessions/:sessionId")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  revokeSession(
    @Param("sessionId") sessionId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.auth.revokeSession(sessionId, user.id);
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: AuthUser,
  ) {
    const token = req.cookies?.refresh_token;
    if (token) {
      const payload = this.decodeRefreshToken(token);
      if (payload?.sid) {
        await this.auth.revokeSession(payload.sid, user.id);
      }
    }
    clearAuthCookies(res);
  }

  @Post("logout/all")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutAll(
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: AuthUser,
  ) {
    await this.auth.revokeAllSessions(user.id, user.id);
    clearAuthCookies(res);
  }
  @SkipThrottle()
  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return user;
  }

  private decodeRefreshToken(token: string): { sid?: string } | null {
    try {
      const parts = token.split(".");
      const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
      return payload;
    } catch {
      return null;
    }
  }
}
