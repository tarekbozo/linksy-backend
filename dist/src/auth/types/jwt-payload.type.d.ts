import { Role } from '@prisma/client';
export type JwtPayload = {
    sub: string;
    email: string;
    role: Role;
    sid: string;
};
export type JwtRefreshPayload = {
    sub: string;
    sid: string;
};
