import { IsEmail, IsString, MinLength } from "class-validator";

export class MagicVerifyDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(20)
  token!: string;
}
