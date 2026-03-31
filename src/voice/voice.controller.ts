import { Body, Controller, Post, HttpCode, HttpStatus } from "@nestjs/common";
import { IsBase64, IsIn, IsOptional, IsString } from "class-validator";
import { VoiceService } from "./voice.service";
import { AuthUser, CurrentUser } from "src/auth/decorators";

export class TranscribeDto {
  @IsString()
  audioBase64: string;

  @IsString()
  mimeType: string;

  @IsOptional()
  @IsIn(["ar", "en", "auto"])
  language?: "ar" | "en" | "auto";
}

@Controller("voice")
export class VoiceController {
  constructor(private readonly voice: VoiceService) {}

  @Post("transcribe")
  @HttpCode(HttpStatus.OK)
  transcribe(@CurrentUser() user: AuthUser, @Body() dto: TranscribeDto) {
    return this.voice.transcribe(
      user.id,
      dto.audioBase64,
      dto.mimeType,
      dto.language ?? "auto",
    );
  }
}
