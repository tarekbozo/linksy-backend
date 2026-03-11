"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSRF_HEADER_NAME = exports.CSRF_COOKIE_NAME = exports.REFRESH_COOKIE_NAME = exports.ACCESS_COOKIE_NAME = void 0;
exports.buildAccessCookieOptions = buildAccessCookieOptions;
exports.buildRefreshCookieOptions = buildRefreshCookieOptions;
exports.buildCsrfCookieOptions = buildCsrfCookieOptions;
exports.setAuthCookies = setAuthCookies;
exports.clearAuthCookies = clearAuthCookies;
const isProd = process.env.NODE_ENV === 'production';
const cookieDomain = process.env.COOKIE_DOMAIN || undefined;
const authCookiePath = process.env.AUTH_COOKIE_PATH || '/api/v1/auth';
exports.ACCESS_COOKIE_NAME = 'access_token';
exports.REFRESH_COOKIE_NAME = 'refresh_token';
exports.CSRF_COOKIE_NAME = 'csrf_token';
exports.CSRF_HEADER_NAME = 'x-csrf-token';
function buildAccessCookieOptions() {
    return {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60 * 1000,
        domain: cookieDomain,
    };
}
function buildRefreshCookieOptions() {
    return {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        path: authCookiePath,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        domain: cookieDomain,
    };
}
function buildCsrfCookieOptions() {
    return {
        httpOnly: false,
        secure: isProd,
        sameSite: 'strict',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000,
        domain: cookieDomain,
    };
}
function setAuthCookies(res, accessToken, refreshToken) {
    res.cookie(exports.ACCESS_COOKIE_NAME, accessToken, buildAccessCookieOptions());
    res.cookie(exports.REFRESH_COOKIE_NAME, refreshToken, buildRefreshCookieOptions());
}
function clearAuthCookies(res) {
    res.clearCookie(exports.ACCESS_COOKIE_NAME, { path: '/', domain: cookieDomain });
    res.clearCookie(exports.REFRESH_COOKIE_NAME, { path: authCookiePath, domain: cookieDomain });
}
//# sourceMappingURL=cookie.config.js.map