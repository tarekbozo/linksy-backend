// src/chat/chat.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Res,
} from "@nestjs/common";
import { Response } from "express";
import { ChatService, MODEL_OPTIONS } from "./chat.service";
import { AuthUser, CurrentUser } from "src/auth/decorators";
import { StreamMessageDto } from "./dto/stream-message.dto";

@Controller("chat")
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get("models")
  listModels() {
    return { models: MODEL_OPTIONS };
  }

  // ── Conversations ──────────────────────────────────────────────────────────

  @Get("conversations")
  list(@CurrentUser() user: AuthUser) {
    return this.chat.listConversations(user.id);
  }

  @Post("conversations")
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: { provider?: "ANTHROPIC" | "OPENAI"; model?: string; isInternal?: boolean },
  ) {
    return this.chat.createConversation(
      user.id,
      body.provider,
      body.model,
      body.isInternal ?? false,
    );
  }

  @Get("conversations/:id")
  getOne(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.chat.getConversation(user.id, id);
  }

  @Delete("conversations/:id")
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.chat.deleteConversation(user.id, id);
  }

  @Patch("conversations/:id/title")
  updateTitle(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: { title: string },
  ) {
    return this.chat.updateTitle(user.id, id, body.title);
  }

  // ── Streaming ─────────────────────────────────────────────────────────────

  @Post("conversations/:id/stream")
  async stream(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: StreamMessageDto,
    @Res() res: Response,
    @Headers("x-internal-session") studySession?: string,
  ) {
    await this.chat.streamChat(
      user.id,
      id,
      body.message,
      res,
      body.file,
      body.modelId,
      studySession === "true",
    );
  }
}
