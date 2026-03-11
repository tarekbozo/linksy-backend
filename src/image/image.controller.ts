// src/image/image.controller.ts
import {
  Body,
  Controller,
  Get,
  Post,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { IsString, IsNotEmpty, IsOptional, IsIn } from "class-validator";
import { ImageService } from "./image.service";
import { AuthUser, CurrentUser } from "src/auth/decorators";

export class GenerateImageDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsOptional()
  @IsIn(["1:1", "16:9", "9:16", "4:3"])
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3";
}

@Controller("image")
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Post("generate")
  @HttpCode(HttpStatus.OK)
  generate(@CurrentUser() user: AuthUser, @Body() body: GenerateImageDto) {
    return this.imageService.generate(
      user.id,
      body.prompt,
      body.aspectRatio ?? "1:1",
    );
  }

  @Get("status")
  status(@CurrentUser() user: AuthUser) {
    return this.imageService.getStatus(user.id);
  }

  @Get("history")
  history(@CurrentUser() user: AuthUser) {
    return this.imageService.getHistory(user.id);
  }
}
