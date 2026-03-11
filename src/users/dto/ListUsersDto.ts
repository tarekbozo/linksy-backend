// list-users.dto.ts
import { IsEnum, IsNumberString, IsOptional, IsString } from "class-validator";
import { Role } from "@prisma/client";

export class ListUsersDto {
  @IsOptional() @IsEnum(Role) role?: Role;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsNumberString() skip?: string;
  @IsOptional() @IsNumberString() take?: string;
}
