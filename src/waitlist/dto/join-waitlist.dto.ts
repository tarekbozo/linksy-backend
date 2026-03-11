import { IsEmail, IsOptional, IsString, MaxLength } from "class-validator";

export class JoinWaitlistDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  source?: string; // "landing", "agent", etc

  @IsOptional()
  @IsString()
  @MaxLength(10)
  locale?: string; // "ar", "en"

  @IsOptional()
  @IsString()
  @MaxLength(20)
  ref?: string;
}
