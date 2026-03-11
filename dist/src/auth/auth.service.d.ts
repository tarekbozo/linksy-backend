import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';
type Meta = {
    ip?: string;
    userAgent?: string;
};
type OAuthInput = {
    provider: 'google' | 'github';
    providerAccountId: string;
    email: string;
    emailVerified: boolean;
};
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    private readonly config;
    private readonly email;
    private readonly audit;
    private readonly logger;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService, email: EmailService, audit: AuditService);
    private sha256;
    normalizeEmail(email: string): string;
    requestMagicLink(rawEmail: string, meta: Meta): Promise<{
        ok: boolean;
    }>;
    verifyMagicLink(rawEmail: string, token: string, meta: Meta): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
            onboarded: boolean;
        };
    }>;
    handleOAuth(input: OAuthInput, meta: Meta): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
            onboarded: boolean;
        };
    }>;
    refreshTokens(rawRefreshToken: string, meta: Meta): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
            onboarded: boolean;
        };
    }>;
    revokeSession(sessionId: string, userId: string): Promise<void>;
    revokeAllSessions(userId: string, actorId?: string): Promise<void>;
    getSessions(userId: string): Promise<{
        id: string;
        createdAt: Date;
        userAgent: string | null;
        ipAddress: string | null;
        lastUsedAt: Date;
    }[]>;
    private issueTokenPair;
    private issueTokenPairWithClient;
    validateSession(sessionId: string, userId: string): Promise<{
        id: string;
        email: string;
        role: import(".prisma/client").$Enums.Role;
        isActive: boolean;
        onboarded: boolean;
    }>;
}
export {};
