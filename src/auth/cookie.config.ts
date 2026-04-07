import type { CookieOptions, Response } from "express";

const isProd = process.env.NODE_ENV === "production";
const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

export const ACCESS_COOKIE_NAME = "access_token";
export const REFRESH_COOKIE_NAME = "refresh_token";
export const CSRF_COOKIE_NAME = "csrf_token";
export const CSRF_HEADER_NAME = "x-csrf-token";

export function buildAccessCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: 24 * 60 * 60 * 1000,
    domain: cookieDomain,
  };
}

export function buildRefreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000,
    domain: cookieDomain,
  };
}

export function buildCsrfCookieOptions(): CookieOptions {
  return {
    httpOnly: false,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: 24 * 60 * 60 * 1000,
    domain: cookieDomain,
  };
}

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
) {
  res.cookie(ACCESS_COOKIE_NAME, accessToken, buildAccessCookieOptions());
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, buildRefreshCookieOptions());
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE_NAME, { path: "/", domain: cookieDomain });
  res.clearCookie(REFRESH_COOKIE_NAME, {
    path: "/",
    domain: cookieDomain,
  });
}
