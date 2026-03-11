import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthUser } from './decorators';
import { MagicRequestDto, MagicVerifyDto } from './dto/auth.dto';
import type { OAuthProfile } from './strategies/oauth.strategies';
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    getCsrf(res: Response): {
        csrfToken: string;
    };
    magicRequest(dto: MagicRequestDto, ip: string, userAgent: string): Promise<{
        ok: boolean;
    }>;
    magicVerify(dto: MagicVerifyDto, res: Response, ip: string, userAgent: string): Promise<{
        user: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
            onboarded: boolean;
        };
    }>;
    googleLogin(): void;
    googleCallback(req: Request & {
        user: OAuthProfile;
    }, res: Response, ip: string, userAgent: string): Promise<void>;
    githubLogin(): void;
    githubCallback(req: Request & {
        user: OAuthProfile;
    }, res: Response, ip: string, userAgent: string): Promise<void>;
    refresh(req: Request, res: Response, ip: string, userAgent: string): Promise<{
        user: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
            onboarded: boolean;
        };
    } | undefined>;
    getSessions(user: AuthUser): Promise<{
        id: string;
        createdAt: Date;
        userAgent: string | null;
        ipAddress: string | null;
        lastUsedAt: Date;
    }[]>;
    revokeSession(sessionId: string, user: AuthUser): Promise<void>;
    logout(req: Request, res: Response, user: AuthUser): Promise<void>;
    logoutAll(res: Response, user: AuthUser): Promise<void>;
    me(user: AuthUser): AuthUser;
    private decodeRefreshToken;
}
