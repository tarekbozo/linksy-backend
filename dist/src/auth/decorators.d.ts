import { Role } from '@prisma/client';
export declare const ROLES_KEY = "roles";
export declare const Roles: (...roles: Role[]) => import("@nestjs/common").CustomDecorator<string>;
export declare const IS_PUBLIC_KEY = "isPublic";
export declare const Public: () => import("@nestjs/common").CustomDecorator<string>;
export type AuthUser = {
    id: string;
    email: string;
    role: Role;
    isActive: boolean;
    onboarded: boolean;
};
export declare const CurrentUser: (...dataOrPipes: unknown[]) => ParameterDecorator;
export declare const IpAddress: (...dataOrPipes: unknown[]) => ParameterDecorator;
export declare const UserAgent: (...dataOrPipes: unknown[]) => ParameterDecorator;
