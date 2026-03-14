import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { BillingService } from "../billing/billing.service";
import { UsageType } from "@prisma/client";
import { Response } from "express";
import * as mammoth from "mammoth";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (
  buffer: Buffer,
) => Promise<{ text: string }>;

export type AiProvider = "ANTHROPIC" | "OPENAI" | "GEMINI";

export const MODEL_OPTIONS = {
  ANTHROPIC: [
    { id: "claude-haiku-4-5-20251001", label: "Claude Haiku (Fast)" },
    { id: "claude-sonnet-4-6", label: "Claude Sonnet (Smart)" },
  ],
  OPENAI: [
    { id: "gpt-4.1-nano", label: "GPT-4.1 Nano (Fast)" },
    { id: "gpt-4.1-mini", label: "GPT-4.1 Mini (Fast)" },
    { id: "gpt-4o", label: "GPT-4o (Smart)" },
    { id: "gpt-4o-mini", label: "GPT-4o Mini (Fast)" },
  ],
  GEMINI: [{ id: "gemini-2.5-flash", label: "Gemini Flash (Fast)" }],
};

// ── Resolve provider from model ID ────────────────────────────────────────────
function resolveProvider(modelId: string): AiProvider {
  for (const [provider, models] of Object.entries(MODEL_OPTIONS)) {
    if (models.some((m) => m.id === modelId)) {
      return provider as AiProvider;
    }
  }
  // fallback: infer from model id prefix
  if (modelId.startsWith("claude")) return "ANTHROPIC";
  if (modelId.startsWith("gpt") || modelId.startsWith("o1")) return "OPENAI";
  return "GEMINI";
}

// ── Plan-based max output tokens ─────────────────────────────────────────────
const MAX_TOKENS_BY_PLAN: Record<string, number> = {
  FREE: 1024,
  STARTER: 2048,
  PRO: 4096,
  ELITE: 8192,
};

// ── Supported file types ──────────────────────────────────────────────────────
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const CODE_EXTS = [
  ".js",
  ".ts",
  ".py",
  ".java",
  ".c",
  ".cpp",
  ".cs",
  ".go",
  ".rs",
  ".php",
  ".rb",
  ".swift",
  ".kt",
  ".html",
  ".css",
  ".json",
  ".yaml",
  ".yml",
  ".xml",
  ".sh",
  ".sql",
];

export interface AttachedFile {
  name: string;
  mimeType: string;
  base64: string;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly anthropic: Anthropic;
  private readonly openai: OpenAI;
  private readonly gemini: GoogleGenerativeAI | null;

  private readonly SYSTEM =
    "You are LinkSy AI, a helpful assistant built for users in Syria by the LinkSy platform. " +
    "You are not Claude, GPT, or Gemini. " +
    'If asked who made you, what model you are, or who you are, say: "I am LinkSy AI, powered by the best AI models, built by the LinkSy platform." Do not mention Anthropic, Google, or OpenAI. ' +
    "You can help with anything — writing, translation, coding, studying, design, and more. " +
    "You are fully capable of reading and analyzing files, images, documents, and code that users upload — always attempt to process them. " +
    "Be helpful, friendly, and concise. Respond in the same language the user writes in. " +
    "If you are unable to help with a request due to your current limitations, always let the user know they can try switching to a different model using the model selector at the bottom of the chat — a different model may be able to assist them better.";

  constructor(
    private readonly prisma: PrismaService,
    private readonly billing: BillingService,
    private readonly config: ConfigService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.config.get<string>("ANTHROPIC_API_KEY"),
    });
    this.openai = new OpenAI({
      apiKey: this.config.get<string>("OPENAI_API_KEY"),
    });
    const geminiKey = this.config.get<string>("GEMINI_API_KEY");
    this.gemini = geminiKey ? new GoogleGenerativeAI(geminiKey) : null;
  }

  // ── File helpers ──────────────────────────────────────────────────────────

  private isImage(file: AttachedFile): boolean {
    return IMAGE_TYPES.includes(file.mimeType);
  }

  private isCode(file: AttachedFile): boolean {
    const ext = "." + (file.name.split(".").pop()?.toLowerCase() ?? "");
    return CODE_EXTS.includes(ext);
  }

  private async extractText(file: AttachedFile): Promise<string> {
    const buffer = Buffer.from(file.base64, "base64");

    if (file.mimeType === "application/pdf") {
      const parsed = await pdfParse(buffer);
      return parsed.text;
    }

    if (
      file.mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    return buffer.toString("utf-8");
  }

  private async buildTextContent(
    userMessage: string,
    file?: AttachedFile,
  ): Promise<string> {
    if (!file) return userMessage;
    if (this.isImage(file)) return userMessage || "What is in this image?";

    const extracted = await this.extractText(file);
    const truncated = extracted.slice(0, 80_000);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "txt";
    const lang = this.isCode(file) ? ext : "";

    const context = lang
      ? `\`\`\`${lang}\n// File: ${file.name}\n${truncated}\n\`\`\``
      : `--- File: ${file.name} ---\n${truncated}\n--- End of file ---`;

    return `${context}\n\n${userMessage || "Please analyse this file."}`;
  }

  private async buildAnthropicContent(
    userMessage: string,
    file?: AttachedFile,
  ): Promise<Anthropic.MessageParam["content"]> {
    if (!file) return userMessage;

    if (this.isImage(file)) {
      return [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: file.mimeType as
              | "image/jpeg"
              | "image/png"
              | "image/gif"
              | "image/webp",
            data: file.base64,
          },
        },
        { type: "text", text: userMessage || "What is in this image?" },
      ];
    }

    return await this.buildTextContent(userMessage, file);
  }

  // ── Conversations CRUD ────────────────────────────────────────────────────

  async listConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        provider: true,
        model: true,
        updatedAt: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, role: true },
        },
      },
    });
  }

  async getConversation(userId: string, conversationId: string) {
    const conv = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            role: true,
            content: true,
            model: true,
            tokens: true,
            createdAt: true,
          },
        },
      },
    });
    if (!conv) throw new NotFoundException("Conversation not found");
    return conv;
  }

  async createConversation(
    userId: string,
    provider: AiProvider = "ANTHROPIC",
    model?: string,
  ) {
    const defaultModel = model ?? MODEL_OPTIONS[provider][0].id;
    return this.prisma.conversation.create({
      data: { userId, provider, model: defaultModel },
    });
  }

  async deleteConversation(userId: string, conversationId: string) {
    const conv = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });
    if (!conv) throw new NotFoundException("Conversation not found");
    await this.prisma.conversation.delete({ where: { id: conversationId } });
    return { ok: true };
  }

  async updateTitle(userId: string, conversationId: string, title: string) {
    await this.prisma.conversation.updateMany({
      where: { id: conversationId, userId },
      data: { title: title.slice(0, 100) },
    });
    return { ok: true };
  }

  // ── Streaming chat ────────────────────────────────────────────────────────

  async streamChat(
    userId: string,
    conversationId: string,
    userMessage: string,
    res: Response,
    file?: AttachedFile,
    modelId?: string, // optional per-request model override from frontend
  ) {
    // 1. Check quota
    const canUse = await this.billing.canConsume(userId, UsageType.CHAT, 1);
    if (!canUse.allowed) throw new ForbiddenException(canUse.message);

    // 2. Load conversation + history
    const conv = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      include: { messages: { orderBy: { createdAt: "asc" }, take: 40 } },
    });
    if (!conv) throw new NotFoundException("Conversation not found");

    // 2b. Get user plan for max_tokens
    const pass = await this.prisma.pass.findUnique({ where: { userId } });
    const userPlan = pass?.plan ?? "FREE";
    const maxTokens = MAX_TOKENS_BY_PLAN[userPlan] ?? 1024;

    // 2c. Resolve which model + provider to actually use.
    //     If the frontend sent a modelId, use that. Otherwise fall back to
    //     whatever the conversation was created with.
    const activeModelId = modelId ?? conv.model;
    const activeProvider = modelId
      ? resolveProvider(modelId)
      : (conv.provider as AiProvider);

    // 3. Save user message
    const savedContent = file ? `[${file.name}]\n${userMessage}` : userMessage;
    await this.prisma.chatMessage.create({
      data: { conversationId, userId, role: "user", content: savedContent },
    });

    // 4. Build plain-text history
    const history: { role: "user" | "assistant"; content: string }[] =
      conv.messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    // 5. SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.setHeader("Transfer-Encoding", "chunked");
    res.flushHeaders();

    const send = (data: object) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      // Force flush after every write — prevents Express compression middleware
      // from buffering SSE chunks and sending them all at once (causes browser freeze)
      if (typeof (res as any).flush === "function") (res as any).flush();
    };

    let fullText = "";
    let totalTokens = 0;

    try {
      // ── ANTHROPIC ──────────────────────────────────────────────────────
      if (activeProvider === "ANTHROPIC") {
        const latestContent = await this.buildAnthropicContent(
          userMessage,
          file,
        );

        const stream = this.anthropic.messages.stream({
          model: activeModelId,
          max_tokens: maxTokens,
          system: this.SYSTEM,
          messages: [
            ...history.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: latestContent },
          ],
        });

        stream.on("text", (text) => {
          fullText += text;
          send({ type: "delta", text });
        });

        stream.on("error", (err) => {
          this.logger.error("Anthropic stream error", err);
        });

        stream.on("finalMessage", (msg) => {
          this.logger.log(
            `Anthropic done, tokens: ${msg.usage.input_tokens + msg.usage.output_tokens}`,
          );
        });

        const final = await stream.finalMessage();
        totalTokens = final.usage.input_tokens + final.usage.output_tokens;

        // ── OPENAI ─────────────────────────────────────────────────────────
      } else if (activeProvider === "OPENAI") {
        const textContent = await this.buildTextContent(userMessage, file);

        const stream = await this.openai.chat.completions.create({
          model: activeModelId,
          max_tokens: maxTokens,
          messages: [
            { role: "system", content: this.SYSTEM },
            ...history,
            { role: "user", content: textContent },
          ],
          stream: true,
          stream_options: { include_usage: true },
        });

        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) {
            fullText += text;
            send({ type: "delta", text });
          }
          if (chunk.usage) {
            totalTokens =
              chunk.usage.prompt_tokens + chunk.usage.completion_tokens;
          }
        }

        if (!totalTokens) {
          totalTokens = Math.ceil((userMessage.length + fullText.length) / 4);
        }

        // ── GEMINI ─────────────────────────────────────────────────────────
      } else if (activeProvider === "GEMINI") {
        const textContent = await this.buildTextContent(userMessage, file);

        const geminiModel = this.gemini!.getGenerativeModel({
          model: activeModelId,
          systemInstruction: this.SYSTEM,
          generationConfig: { maxOutputTokens: maxTokens },
        });

        const geminiHistory = history.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

        const chat = geminiModel.startChat({ history: geminiHistory });
        const result = await chat.sendMessageStream(textContent);

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            fullText += text;
            send({ type: "delta", text });
          }
        }

        const finalResponse = await result.response;
        totalTokens =
          finalResponse.usageMetadata?.totalTokenCount ??
          Math.ceil((userMessage.length + fullText.length) / 4);
      }

      // 6. Save assistant reply + update conversation timestamp
      await this.prisma.$transaction([
        this.prisma.chatMessage.create({
          data: {
            conversationId,
            userId,
            role: "assistant",
            content: fullText,
            model: activeModelId,
            tokens: totalTokens,
          },
        }),
        this.prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        }),
      ]);

      // 7. Auto-title on first message
      if (conv.messages.length === 0) {
        const title =
          (file ? `[${file.name}] ` : "") +
          userMessage.trim().replace(/\s+/g, " ").slice(0, 50);
        await this.prisma.conversation.update({
          where: { id: conversationId },
          data: { title: title || "New conversation" },
        });
      }

      // 8. Consume tokens from billing
      await this.billing.consume(
        userId,
        UsageType.CHAT,
        totalTokens,
        0,
        activeModelId,
      );

      send({ type: "done", tokens: totalTokens });
    } catch (err) {
      this.logger.error("Stream error", err);
      if (err instanceof ForbiddenException) {
        send({ type: "error", message: err.message, statusCode: 403 });
      } else {
        send({
          type: "error",
          message: "حدث خطأ أثناء المعالجة. حاول مرة أخرى.",
        });
      }
    } finally {
      res.end();
    }
  }
}
