import { IsEmail, IsOptional, IsString, Length } from "class-validator";

export class MagicRequestDto {
  @IsEmail()
  email!: string;
}

export class MagicVerifyDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(32, 256)
  token!: string;
}

export class RefreshTokenDto {
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
