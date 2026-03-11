import { IsEnum } from "class-validator";
import { Role } from "@prisma/client";

export class SetRoleDto {
  @IsEnum(Role, { message: "Role must be ADMIN, AGENT, or USER." })
  role!: Role;
}
