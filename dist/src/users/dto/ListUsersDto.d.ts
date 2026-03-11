import { Role } from '@prisma/client';
export declare class ListUsersDto {
    role?: Role;
    search?: string;
    skip?: string;
    take?: string;
}
