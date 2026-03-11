import { Body, Controller, Post, HttpCode, HttpStatus } from "@nestjs/common";
import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { EmailService } from "src/email/email.service";

export class ContactDto {
  @IsString() @IsNotEmpty() name: string;
  @IsEmail() email: string;
  @IsString() @IsOptional() subject?: string;
  @IsString() @IsNotEmpty() message: string;
}

@Controller("contact")
export class ContactController {
  constructor(private readonly email: EmailService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async send(@Body() body: ContactDto) {
    await this.email.sendContactForm(
      body.name,
      body.email,
      body.subject ?? "—",
      body.message,
    );
    return { ok: true };
  }
}
