// src/chat/dto/stream-message.dto.ts
import { IsString, IsOptional, IsObject } from "class-validator";

export class StreamMessageDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsObject()
  file?: {
    name: string;
    mimeType: string;
    base64: string;
  };

  @IsOptional()
  @IsString()
  modelId?: string;
}
