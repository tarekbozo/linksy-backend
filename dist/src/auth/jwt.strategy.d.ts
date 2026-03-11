import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { JwtPayload } from './types/jwt-payload.type';
import { AuthService } from './auth.service';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly authService;
    constructor(config: ConfigService, authService: AuthService);
    validate(payload: JwtPayload): Promise<{
        id: string;
        email: string;
        role: import(".prisma/client").$Enums.Role;
        isActive: boolean;
        onboarded: boolean;
    }>;
}
export {};
