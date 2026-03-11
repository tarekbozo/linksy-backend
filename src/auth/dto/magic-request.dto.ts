import { IsEmail } from "class-validator";

export class MagicRequestDto {
  @IsEmail()
  email!: string;
}
