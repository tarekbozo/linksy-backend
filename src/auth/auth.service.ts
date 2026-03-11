import {
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { AuditAction, Prisma, Role } from "@prisma/client";
import { createHash, randomBytes } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { AuditService } from "../audit/audit.service";
import { JwtPayload, JwtRefreshPayload } from "./types/jwt-payload.type";

const SESSION_TTL_DAYS = 30;
const MAGIC_TTL_MINUTES = 15;
const MAX_SESSIONS_PER_USER = 5;

type Meta = { ip?: string; userAgent?: string };
type PublicUser = {
  id: string;
  email: string;
  role: Role;
  isActive?: boolean;
  onboarded?: boolean;
};

type OAuthInput = {
  provider: "google" | "github";
  providerAccountId: string;
  email: string;
  emailVerified: boolean;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly email: EmailService,
    private readonly audit: AuditService,
  ) {}

  private sha256(value: string): string {
    return createHash("sha256").update(value).digest("hex");
  }

  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  async requestMagicLink(rawEmail: string, meta: Meta) {
    const email = this.normalizeEmail(rawEmail);

    const user = await this.prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, role: Role.USER },
      select: { id: true, email: true, isActive: true },
    });

    await this.prisma.waitlistEntry.upsert({
      where: { email },
      update: { updatedAt: new Date() },
      create: { email, status: "PENDING", source: "auth", locale: "ar" },
    });

    if (!user.isActive) return { ok: true };

    await this.prisma.magicToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = this.sha256(rawToken);
    const expiresAt = new Date(Date.now() + MAGIC_TTL_MINUTES * 60 * 1000);

    await this.prisma.magicToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const link = `${this.config.get<string>("WEB_URL")}/auth/magic?email=${encodeURIComponent(email)}&token=${rawToken}`;
    await this.email.sendMagicLink(email, link);

    await this.audit.log({
      userId: user.id,
      action: AuditAction.MAGIC_LINK_REQUESTED,
      metadata: { ip: meta.ip, userAgent: meta.userAgent },
    });

    return { ok: true };
  }

  async verifyMagicLink(rawEmail: string, token: string, meta: Meta) {
    const email = this.normalizeEmail(rawEmail);
    const tokenHash = this.sha256(token);

    const record = await this.prisma.magicToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            onboarded: true,
          },
        },
      },
    });

    if (!record || record.user.email !== email)
      throw new UnauthorizedException("Invalid link.");
    if (record.usedAt) throw new UnauthorizedException("Link already used.");
    if (record.expiresAt.getTime() < Date.now())
      throw new UnauthorizedException("Link expired.");
    if (!record.user.isActive)
      throw new ForbiddenException("Account deactivated.");

    await this.prisma.magicToken.update({
      where: { tokenHash },
      data: { usedAt: new Date() },
    });
    await this.audit.log({
      userId: record.user.id,
      action: AuditAction.MAGIC_LINK_VERIFIED,
      metadata: { ip: meta.ip, userAgent: meta.userAgent },
    });

    return this.issueTokenPair(record.user, meta);
  }

  async handleOAuth(input: OAuthInput, meta: Meta) {
    const email = this.normalizeEmail(input.email);

    const existingAccount = await this.prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: input.provider,
          providerAccountId: input.providerAccountId,
        },
      },
      include: { user: true },
    });

    if (existingAccount) {
      if (!existingAccount.user.isActive)
        throw new ForbiddenException("Account deactivated.");
      await this.audit.log({
        userId: existingAccount.userId,
        action: AuditAction.OAUTH_LOGIN,
        metadata: { provider: input.provider, ip: meta.ip },
      });
      return this.issueTokenPair(existingAccount.user, meta);
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      if (!existingUser.isActive)
        throw new ForbiddenException("Account deactivated.");
      if (!input.emailVerified) {
        throw new ForbiddenException(
          "Provider email must be verified before linking to an existing account.",
        );
      }
      await this.prisma.account.create({
        data: {
          userId: existingUser.id,
          provider: input.provider,
          providerAccountId: input.providerAccountId,
        },
      });
      await this.audit.log({
        userId: existingUser.id,
        action: AuditAction.ACCOUNT_LINKED,
        metadata: { provider: input.provider, ip: meta.ip },
      });
      return this.issueTokenPair(existingUser, meta);
    }

    const newUser = await this.prisma.user.create({
      data: {
        email,
        role: Role.USER,
        accounts: {
          create: {
            provider: input.provider,
            providerAccountId: input.providerAccountId,
          },
        },
      },
    });

    await this.audit.log({
      userId: newUser.id,
      action: AuditAction.ACCOUNT_CREATED,
      metadata: {
        provider: input.provider,
        ip: meta.ip,
        emailVerified: input.emailVerified,
      },
    });

    return this.issueTokenPair(newUser, meta);
  }

  async refreshTokens(rawRefreshToken: string, meta: Meta) {
    let payload: JwtRefreshPayload & { token?: string };
    try {
      payload = await this.jwt.verifyAsync<
        JwtRefreshPayload & { token?: string }
      >(rawRefreshToken, {
        secret: this.config.get<string>("JWT_REFRESH_SECRET")!,
      });
    } catch {
      throw new UnauthorizedException("Invalid refresh token.");
    }

    if (!payload.sid || !payload.sub || !payload.token) {
      throw new UnauthorizedException("Invalid refresh token.");
    }

    const tokenHash = this.sha256(payload.token);
    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !session ||
      session.id !== payload.sid ||
      session.userId !== payload.sub ||
      session.revokedAt ||
      session.expiresAt < new Date()
    ) {
      await this.prisma.session.updateMany({
        where: { userId: payload.sub, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await this.audit.log({
        userId: payload.sub,
        action: AuditAction.SESSION_REVOKED,
        metadata: { reason: "refresh_reuse_or_session_mismatch", ip: meta.ip },
      });
      throw new UnauthorizedException("Session invalid. Please log in again.");
    }

    if (!session.user.isActive)
      throw new ForbiddenException("Account deactivated.");

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date(), lastUsedAt: new Date() },
      });
      return this.issueTokenPairWithClient(tx, session.user, meta);
    });

    await this.audit.log({
      userId: session.userId,
      action: AuditAction.TOKEN_REFRESHED,
      metadata: { ip: meta.ip, userAgent: meta.userAgent },
    });

    return result;
  }

  async revokeSession(sessionId: string, userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.audit.log({
      userId,
      action: AuditAction.SESSION_REVOKED,
      metadata: { sessionId },
    });
  }

  async revokeAllSessions(userId: string, actorId?: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.audit.log({
      userId,
      actorId,
      action: AuditAction.LOGOUT_ALL_SESSIONS,
    });
  }

  async getSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        lastUsedAt: true,
      },
      orderBy: { lastUsedAt: "desc" },
    });
  }

  private async issueTokenPair(user: PublicUser, meta: Meta) {
    return this.issueTokenPairWithClient(this.prisma, user, meta);
  }

  private async issueTokenPairWithClient(
    client: Prisma.TransactionClient | PrismaService,
    user: PublicUser,
    meta: Meta,
  ) {
    await client.session.deleteMany({
      where: { userId: user.id, expiresAt: { lt: new Date() } },
    });

    const activeSessions = await client.session.findMany({
      where: { userId: user.id, revokedAt: null },
      orderBy: { createdAt: "asc" },
    });
    if (activeSessions.length >= MAX_SESSIONS_PER_USER) {
      const overflow = activeSessions.length - MAX_SESSIONS_PER_USER + 1;
      const toRevoke = activeSessions.slice(0, overflow).map((s) => s.id);
      await client.session.updateMany({
        where: { id: { in: toRevoke } },
        data: { revokedAt: new Date() },
      });
    }

    const rawRefreshSecret = randomBytes(64).toString("hex");
    const tokenHash = this.sha256(rawRefreshSecret);
    const expiresAt = new Date(
      Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
    );

    const session = await client.session.create({
      data: {
        userId: user.id,
        tokenHash,
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
        expiresAt,
      },
    });

    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sid: session.id,
    };
    const refreshPayload: JwtRefreshPayload & { token: string } = {
      sub: user.id,
      sid: session.id,
      token: rawRefreshSecret,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(accessPayload, {
        secret: this.config.get<string>("JWT_ACCESS_SECRET")!,
        expiresIn: "15m",
      }),
      this.jwt.signAsync(refreshPayload, {
        secret: this.config.get<string>("JWT_REFRESH_SECRET")!,
        expiresIn: `${SESSION_TTL_DAYS}d`,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        onboarded: user.onboarded ?? false,
      },
    };
  }

  async validateSession(sessionId: string, userId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException("Session expired or revoked.");
    }
    if (session.userId !== userId) {
      throw new UnauthorizedException();
    }
    this.prisma.session
      .update({ where: { id: sessionId }, data: { lastUsedAt: new Date() } })
      .catch((err) =>
        this.logger.warn(`Failed to update session lastUsedAt: ${String(err)}`),
      );
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        onboarded: true,
      },
    });
  }
}
