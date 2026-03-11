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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("../email/email.service");
const audit_service_1 = require("../audit/audit.service");
const SESSION_TTL_DAYS = 30;
const MAGIC_TTL_MINUTES = 15;
const MAX_SESSIONS_PER_USER = 5;
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwt;
    config;
    email;
    audit;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(prisma, jwt, config, email, audit) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
        this.email = email;
        this.audit = audit;
    }
    sha256(value) {
        return (0, crypto_1.createHash)('sha256').update(value).digest('hex');
    }
    normalizeEmail(email) {
        return email.trim().toLowerCase();
    }
    async requestMagicLink(rawEmail, meta) {
        const email = this.normalizeEmail(rawEmail);
        const user = await this.prisma.user.upsert({
            where: { email },
            update: {},
            create: { email, role: client_1.Role.USER },
            select: { id: true, email: true, isActive: true },
        });
        await this.prisma.waitlistEntry.upsert({
            where: { email },
            update: { updatedAt: new Date() },
            create: { email, status: 'PENDING', source: 'auth', locale: 'ar' },
        });
        if (!user.isActive)
            return { ok: true };
        await this.prisma.magicToken.updateMany({
            where: { userId: user.id, usedAt: null },
            data: { usedAt: new Date() },
        });
        const rawToken = (0, crypto_1.randomBytes)(32).toString('hex');
        const tokenHash = this.sha256(rawToken);
        const expiresAt = new Date(Date.now() + MAGIC_TTL_MINUTES * 60 * 1000);
        await this.prisma.magicToken.create({
            data: { userId: user.id, tokenHash, expiresAt },
        });
        const link = `${this.config.get('WEB_URL')}/auth/magic?email=${encodeURIComponent(email)}&token=${rawToken}`;
        await this.email.sendMagicLink(email, link);
        await this.audit.log({
            userId: user.id,
            action: client_1.AuditAction.MAGIC_LINK_REQUESTED,
            metadata: { ip: meta.ip, userAgent: meta.userAgent },
        });
        return { ok: true };
    }
    async verifyMagicLink(rawEmail, token, meta) {
        const email = this.normalizeEmail(rawEmail);
        const tokenHash = this.sha256(token);
        const record = await this.prisma.magicToken.findUnique({
            where: { tokenHash },
            include: { user: { select: { id: true, email: true, role: true, isActive: true, onboarded: true } } },
        });
        if (!record || record.user.email !== email)
            throw new common_1.UnauthorizedException('Invalid link.');
        if (record.usedAt)
            throw new common_1.UnauthorizedException('Link already used.');
        if (record.expiresAt.getTime() < Date.now())
            throw new common_1.UnauthorizedException('Link expired.');
        if (!record.user.isActive)
            throw new common_1.ForbiddenException('Account deactivated.');
        await this.prisma.magicToken.update({ where: { tokenHash }, data: { usedAt: new Date() } });
        await this.audit.log({
            userId: record.user.id,
            action: client_1.AuditAction.MAGIC_LINK_VERIFIED,
            metadata: { ip: meta.ip, userAgent: meta.userAgent },
        });
        return this.issueTokenPair(record.user, meta);
    }
    async handleOAuth(input, meta) {
        const email = this.normalizeEmail(input.email);
        const existingAccount = await this.prisma.account.findUnique({
            where: { provider_providerAccountId: { provider: input.provider, providerAccountId: input.providerAccountId } },
            include: { user: true },
        });
        if (existingAccount) {
            if (!existingAccount.user.isActive)
                throw new common_1.ForbiddenException('Account deactivated.');
            await this.audit.log({
                userId: existingAccount.userId,
                action: client_1.AuditAction.OAUTH_LOGIN,
                metadata: { provider: input.provider, ip: meta.ip },
            });
            return this.issueTokenPair(existingAccount.user, meta);
        }
        const existingUser = await this.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            if (!existingUser.isActive)
                throw new common_1.ForbiddenException('Account deactivated.');
            if (!input.emailVerified) {
                throw new common_1.ForbiddenException('Provider email must be verified before linking to an existing account.');
            }
            await this.prisma.account.create({
                data: { userId: existingUser.id, provider: input.provider, providerAccountId: input.providerAccountId },
            });
            await this.audit.log({
                userId: existingUser.id,
                action: client_1.AuditAction.ACCOUNT_LINKED,
                metadata: { provider: input.provider, ip: meta.ip },
            });
            return this.issueTokenPair(existingUser, meta);
        }
        const newUser = await this.prisma.user.create({
            data: {
                email,
                role: client_1.Role.USER,
                accounts: { create: { provider: input.provider, providerAccountId: input.providerAccountId } },
            },
        });
        await this.audit.log({
            userId: newUser.id,
            action: client_1.AuditAction.ACCOUNT_CREATED,
            metadata: { provider: input.provider, ip: meta.ip, emailVerified: input.emailVerified },
        });
        return this.issueTokenPair(newUser, meta);
    }
    async refreshTokens(rawRefreshToken, meta) {
        let payload;
        try {
            payload = await this.jwt.verifyAsync(rawRefreshToken, {
                secret: this.config.get('JWT_REFRESH_SECRET'),
            });
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid refresh token.');
        }
        if (!payload.sid || !payload.sub || !payload.token) {
            throw new common_1.UnauthorizedException('Invalid refresh token.');
        }
        const tokenHash = this.sha256(payload.token);
        const session = await this.prisma.session.findUnique({ where: { tokenHash }, include: { user: true } });
        if (!session || session.id !== payload.sid || session.userId !== payload.sub || session.revokedAt || session.expiresAt < new Date()) {
            await this.prisma.session.updateMany({ where: { userId: payload.sub, revokedAt: null }, data: { revokedAt: new Date() } });
            await this.audit.log({
                userId: payload.sub,
                action: client_1.AuditAction.SESSION_REVOKED,
                metadata: { reason: 'refresh_reuse_or_session_mismatch', ip: meta.ip },
            });
            throw new common_1.UnauthorizedException('Session invalid. Please log in again.');
        }
        if (!session.user.isActive)
            throw new common_1.ForbiddenException('Account deactivated.');
        const result = await this.prisma.$transaction(async (tx) => {
            await tx.session.update({ where: { id: session.id }, data: { revokedAt: new Date(), lastUsedAt: new Date() } });
            return this.issueTokenPairWithClient(tx, session.user, meta);
        });
        await this.audit.log({
            userId: session.userId,
            action: client_1.AuditAction.TOKEN_REFRESHED,
            metadata: { ip: meta.ip, userAgent: meta.userAgent },
        });
        return result;
    }
    async revokeSession(sessionId, userId) {
        await this.prisma.session.updateMany({ where: { id: sessionId, userId, revokedAt: null }, data: { revokedAt: new Date() } });
        await this.audit.log({ userId, action: client_1.AuditAction.SESSION_REVOKED, metadata: { sessionId } });
    }
    async revokeAllSessions(userId, actorId) {
        await this.prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
        await this.audit.log({ userId, actorId, action: client_1.AuditAction.LOGOUT_ALL_SESSIONS });
    }
    async getSessions(userId) {
        return this.prisma.session.findMany({
            where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
            select: { id: true, ipAddress: true, userAgent: true, createdAt: true, lastUsedAt: true },
            orderBy: { lastUsedAt: 'desc' },
        });
    }
    async issueTokenPair(user, meta) {
        return this.issueTokenPairWithClient(this.prisma, user, meta);
    }
    async issueTokenPairWithClient(client, user, meta) {
        await client.session.deleteMany({ where: { userId: user.id, expiresAt: { lt: new Date() } } });
        const activeSessions = await client.session.findMany({ where: { userId: user.id, revokedAt: null }, orderBy: { createdAt: 'asc' } });
        if (activeSessions.length >= MAX_SESSIONS_PER_USER) {
            const overflow = activeSessions.length - MAX_SESSIONS_PER_USER + 1;
            const toRevoke = activeSessions.slice(0, overflow).map((s) => s.id);
            await client.session.updateMany({ where: { id: { in: toRevoke } }, data: { revokedAt: new Date() } });
        }
        const rawRefreshSecret = (0, crypto_1.randomBytes)(64).toString('hex');
        const tokenHash = this.sha256(rawRefreshSecret);
        const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
        const session = await client.session.create({
            data: {
                userId: user.id,
                tokenHash,
                ipAddress: meta.ip,
                userAgent: meta.userAgent,
                expiresAt,
            },
        });
        const accessPayload = { sub: user.id, email: user.email, role: user.role, sid: session.id };
        const refreshPayload = { sub: user.id, sid: session.id, token: rawRefreshSecret };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwt.signAsync(accessPayload, { secret: this.config.get('JWT_ACCESS_SECRET'), expiresIn: '15m' }),
            this.jwt.signAsync(refreshPayload, { secret: this.config.get('JWT_REFRESH_SECRET'), expiresIn: `${SESSION_TTL_DAYS}d` }),
        ]);
        return {
            accessToken,
            refreshToken,
            user: { id: user.id, email: user.email, role: user.role, onboarded: user.onboarded ?? false },
        };
    }
    async validateSession(sessionId, userId) {
        const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
        if (!session || session.revokedAt || session.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Session expired or revoked.');
        }
        if (session.userId !== userId) {
            throw new common_1.UnauthorizedException();
        }
        this.prisma.session.update({ where: { id: sessionId }, data: { lastUsedAt: new Date() } }).catch((err) => this.logger.warn(`Failed to update session lastUsedAt: ${String(err)}`));
        return this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
            select: { id: true, email: true, role: true, isActive: true, onboarded: true },
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        email_service_1.EmailService,
        audit_service_1.AuditService])
], AuthService);
//# sourceMappingURL=auth.service.js.map