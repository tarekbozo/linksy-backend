import { IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";
import { UsageType } from "@prisma/client";

export class UsageCheckDto {
  @IsEnum(UsageType)
  type!: UsageType;

  @IsInt()
  @Min(0)
  tokens!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  images?: number;

  @IsOptional()
  @IsString()
  model?: string;
}
