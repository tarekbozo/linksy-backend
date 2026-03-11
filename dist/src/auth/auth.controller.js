"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const throttler_1 = require("@nestjs/throttler");
const auth_service_1 = require("./auth.service");
const cookie_config_1 = require("./cookie.config");
const csrf_middleware_1 = require("../common/middleware/csrf.middleware");
const jwt_auth_guard_1 = require("./jwt-auth.guard");
const decorators_1 = require("./decorators");
const auth_dto_1 = require("./dto/auth.dto");
let AuthController = class AuthController {
    auth;
    constructor(auth) {
        this.auth = auth;
    }
    getCsrf(res) {
        const csrfToken = (0, csrf_middleware_1.issueCsrfToken)(res);
        return { csrfToken };
    }
    async magicRequest(dto, ip, userAgent) {
        return this.auth.requestMagicLink(dto.email, { ip, userAgent });
    }
    async magicVerify(dto, res, ip, userAgent) {
        const result = await this.auth.verifyMagicLink(dto.email, dto.token, { ip, userAgent });
        (0, cookie_config_1.setAuthCookies)(res, result.accessToken, result.refreshToken);
        (0, csrf_middleware_1.issueCsrfToken)(res);
        return { user: result.user };
    }
    googleLogin() { }
    async googleCallback(req, res, ip, userAgent) {
        const result = await this.auth.handleOAuth(req.user, { ip, userAgent });
        (0, cookie_config_1.setAuthCookies)(res, result.accessToken, result.refreshToken);
        (0, csrf_middleware_1.issueCsrfToken)(res);
        const webUrl = process.env.WEB_URL ?? 'http://localhost:3000';
        let redirectUrl;
        if (result.user.role === 'AGENT') {
            redirectUrl = `${webUrl}/agent-portal`;
        }
        else {
            redirectUrl = result.user.onboarded ? `${webUrl}/dashboard` : `${webUrl}/onboarding`;
        }
        return res.redirect(redirectUrl);
    }
    githubLogin() { }
    async githubCallback(req, res, ip, userAgent) {
        const result = await this.auth.handleOAuth(req.user, { ip, userAgent });
        (0, cookie_config_1.setAuthCookies)(res, result.accessToken, result.refreshToken);
        (0, csrf_middleware_1.issueCsrfToken)(res);
        const webUrl = process.env.WEB_URL ?? 'http://localhost:3000';
        const redirectUrl = result.user.onboarded ? `${webUrl}/dashboard` : `${webUrl}/onboarding`;
        return res.redirect(redirectUrl);
    }
    async refresh(req, res, ip, userAgent) {
        const token = req.cookies?.refresh_token ?? req.body?.refreshToken;
        if (!token) {
            res.status(common_1.HttpStatus.UNAUTHORIZED).json({ message: 'No refresh token.' });
            return;
        }
        const result = await this.auth.refreshTokens(token, { ip, userAgent });
        (0, cookie_config_1.setAuthCookies)(res, result.accessToken, result.refreshToken);
        (0, csrf_middleware_1.issueCsrfToken)(res);
        return { user: result.user };
    }
    getSessions(user) {
        return this.auth.getSessions(user.id);
    }
    revokeSession(sessionId, user) {
        return this.auth.revokeSession(sessionId, user.id);
    }
    async logout(req, res, user) {
        const token = req.cookies?.refresh_token;
        if (token) {
            const payload = this.decodeRefreshToken(token);
            if (payload?.sid) {
                await this.auth.revokeSession(payload.sid, user.id);
            }
        }
        (0, cookie_config_1.clearAuthCookies)(res);
    }
    async logoutAll(res, user) {
        await this.auth.revokeAllSessions(user.id, user.id);
        (0, cookie_config_1.clearAuthCookies)(res);
    }
    me(user) {
        return user;
    }
    decodeRefreshToken(token) {
        try {
            const parts = token.split('.');
            const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
            return payload;
        }
        catch {
            return null;
        }
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('csrf'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getCsrf", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('magic/request'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, throttler_1.Throttle)({ default: { limit: 3, ttl: 60_000 } }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.IpAddress)()),
    __param(2, (0, decorators_1.UserAgent)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.MagicRequestDto, String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "magicRequest", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('magic/verify'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60_000 } }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __param(2, (0, decorators_1.IpAddress)()),
    __param(3, (0, decorators_1.UserAgent)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.MagicVerifyDto, Object, String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "magicVerify", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('google'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('google')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "googleLogin", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('google/callback'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('google')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, decorators_1.IpAddress)()),
    __param(3, (0, decorators_1.UserAgent)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleCallback", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('github'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('github')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "githubLogin", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('github/callback'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('github')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, decorators_1.IpAddress)()),
    __param(3, (0, decorators_1.UserAgent)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "githubCallback", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, decorators_1.Public)(),
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __param(2, (0, decorators_1.IpAddress)()),
    __param(3, (0, decorators_1.UserAgent)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Get)('sessions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getSessions", null);
__decorate([
    (0, common_1.Delete)('sessions/:sessionId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "revokeSession", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)('logout/all'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logoutAll", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "me", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map