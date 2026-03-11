import { ForbiddenException, Injectable, NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { randomBytes, timingSafeEqual } from "crypto";
import {
  buildCsrfCookieOptions,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
} from "../../auth/cookie.config";

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

  use(req: Request, _res: Response, next: NextFunction) {
    if (this.SAFE_METHODS.has(req.method)) {
      return next();
    }

    if (
      req.path.includes("/callback") ||
      req.path.endsWith("/auth/magic/verify") ||
      req.path.endsWith("/waitlist/join")
    ) {
      return next();
    }

    const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
    const headerToken = req.headers[CSRF_HEADER_NAME] as string | undefined;

    if (!cookieToken || !headerToken) {
      throw new ForbiddenException("Invalid CSRF token.");
    }

    const cookieBuffer = Buffer.from(cookieToken);
    const headerBuffer = Buffer.from(headerToken);

    if (
      cookieBuffer.length !== headerBuffer.length ||
      !timingSafeEqual(cookieBuffer, headerBuffer)
    ) {
      throw new ForbiddenException("Invalid CSRF token.");
    }

    next();
  }
}

export function issueCsrfToken(res: Response): string {
  const token = randomBytes(32).toString("hex");
  res.cookie(CSRF_COOKIE_NAME, token, buildCsrfCookieOptions());
  return token;
}
