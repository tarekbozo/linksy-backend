"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ChatService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = exports.MODEL_OPTIONS = void 0;
const common_1 = require("@nestjs/common");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const openai_1 = __importDefault(require("openai"));
const generative_ai_1 = require("@google/generative-ai");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const billing_service_1 = require("../billing/billing.service");
const client_1 = require("@prisma/client");
const mammoth = __importStar(require("mammoth"));
const pdfParse = require('pdf-parse');
exports.MODEL_OPTIONS = {
    ANTHROPIC: [
        { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku (Fast)' },
        { id: 'claude-sonnet-4-5-20251029', label: 'Claude Sonnet (Smart)' },
    ],
    OPENAI: [
        { id: 'gpt-4.1-nano', label: 'GPT-4.1 Nano (Fast)' },
        { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini (Smart)' },
    ],
    GEMINI: [
        { id: 'gemini-2.5-flash', label: 'Gemini Flash (Fast)' },
    ],
};
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const CODE_EXTS = ['.js', '.ts', '.py', '.java', '.c', '.cpp', '.cs', '.go',
    '.rs', '.php', '.rb', '.swift', '.kt', '.html', '.css',
    '.json', '.yaml', '.yml', '.xml', '.sh', '.sql'];
let ChatService = ChatService_1 = class ChatService {
    prisma;
    billing;
    config;
    logger = new common_1.Logger(ChatService_1.name);
    anthropic;
    openai;
    gemini;
    SYSTEM = 'You are LinkSy AI, a helpful assistant built for users in Syria by the LinkSy platform. ' +
        'You are not Claude, GPT, or Gemini. ' +
        'If asked who made you, what model you are, or who you are, say: "I am LinkSy AI, powered by the best AI models, built by the LinkSy platform." Do not mention Anthropic, Google, or OpenAI. ' +
        'You can help with anything — writing, translation, coding, studying, design, and more. ' +
        'Be helpful, friendly, and concise. Respond in the same language the user writes in.';
    constructor(prisma, billing, config) {
        this.prisma = prisma;
        this.billing = billing;
        this.config = config;
        this.anthropic = new sdk_1.default({
            apiKey: this.config.get('ANTHROPIC_API_KEY'),
        });
        this.openai = new openai_1.default({
            apiKey: this.config.get('OPENAI_API_KEY'),
        });
        const geminiKey = this.config.get('GEMINI_API_KEY');
        this.gemini = geminiKey ? new generative_ai_1.GoogleGenerativeAI(geminiKey) : null;
    }
    isImage(file) {
        return IMAGE_TYPES.includes(file.mimeType);
    }
    isCode(file) {
        const ext = '.' + (file.name.split('.').pop()?.toLowerCase() ?? '');
        return CODE_EXTS.includes(ext);
    }
    async extractText(file) {
        const buffer = Buffer.from(file.base64, 'base64');
        if (file.mimeType === 'application/pdf') {
            const parsed = await pdfParse(buffer);
            return parsed.text;
        }
        if (file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth.extractRawText({ buffer });
            return result.value;
        }
        return buffer.toString('utf-8');
    }
    async buildTextContent(userMessage, file) {
        if (!file)
            return userMessage;
        if (this.isImage(file))
            return userMessage || 'What is in this image?';
        const extracted = await this.extractText(file);
        const truncated = extracted.slice(0, 80_000);
        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'txt';
        const lang = this.isCode(file) ? ext : '';
        const context = lang
            ? `\`\`\`${lang}\n// File: ${file.name}\n${truncated}\n\`\`\``
            : `--- File: ${file.name} ---\n${truncated}\n--- End of file ---`;
        return `${context}\n\n${userMessage || 'Please analyse this file.'}`;
    }
    async buildAnthropicContent(userMessage, file) {
        if (!file)
            return userMessage;
        if (this.isImage(file)) {
            return [
                {
                    type: 'image',
                    source: {
                        type: 'base64',
                        media_type: file.mimeType,
                        data: file.base64,
                    },
                },
                { type: 'text', text: userMessage || 'What is in this image?' },
            ];
        }
        return await this.buildTextContent(userMessage, file);
    }
    async listConversations(userId) {
        return this.prisma.conversation.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            take: 50,
            select: {
                id: true,
                title: true,
                provider: true,
                model: true,
                updatedAt: true,
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: { content: true, role: true },
                },
            },
        });
    }
    async getConversation(userId, conversationId) {
        const conv = await this.prisma.conversation.findFirst({
            where: { id: conversationId, userId },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
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
        if (!conv)
            throw new common_1.NotFoundException('Conversation not found');
        return conv;
    }
    async createConversation(userId, provider = 'ANTHROPIC', model) {
        const defaultModel = model ?? exports.MODEL_OPTIONS[provider][0].id;
        return this.prisma.conversation.create({
            data: { userId, provider, model: defaultModel },
        });
    }
    async deleteConversation(userId, conversationId) {
        const conv = await this.prisma.conversation.findFirst({
            where: { id: conversationId, userId },
        });
        if (!conv)
            throw new common_1.NotFoundException('Conversation not found');
        await this.prisma.conversation.delete({ where: { id: conversationId } });
        return { ok: true };
    }
    async updateTitle(userId, conversationId, title) {
        await this.prisma.conversation.updateMany({
            where: { id: conversationId, userId },
            data: { title: title.slice(0, 100) },
        });
        return { ok: true };
    }
    async streamChat(userId, conversationId, userMessage, res, file) {
        const canUse = await this.billing.canConsume(userId, client_1.UsageType.CHAT, 1);
        if (!canUse.allowed)
            throw new common_1.ForbiddenException(canUse.message);
        const conv = await this.prisma.conversation.findFirst({
            where: { id: conversationId, userId },
            include: { messages: { orderBy: { createdAt: 'asc' }, take: 40 } },
        });
        if (!conv)
            throw new common_1.NotFoundException('Conversation not found');
        const savedContent = file ? `[${file.name}]\n${userMessage}` : userMessage;
        await this.prisma.chatMessage.create({
            data: { conversationId, userId, role: 'user', content: savedContent },
        });
        const history = conv.messages.map((m) => ({
            role: m.role,
            content: m.content,
        }));
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();
        const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);
        let fullText = '';
        let totalTokens = 0;
        try {
            if (conv.provider === 'ANTHROPIC') {
                const latestContent = await this.buildAnthropicContent(userMessage, file);
                const stream = await this.anthropic.messages.stream({
                    model: conv.model,
                    max_tokens: 2048,
                    system: this.SYSTEM,
                    messages: [
                        ...history.map((m) => ({ role: m.role, content: m.content })),
                        { role: 'user', content: latestContent },
                    ],
                });
                for await (const chunk of stream) {
                    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                        fullText += chunk.delta.text;
                        send({ type: 'delta', text: chunk.delta.text });
                    }
                }
                const final = await stream.finalMessage();
                totalTokens = final.usage.input_tokens + final.usage.output_tokens;
            }
            else if (conv.provider === 'OPENAI') {
                const textContent = await this.buildTextContent(userMessage, file);
                const stream = await this.openai.chat.completions.create({
                    model: conv.model,
                    messages: [
                        { role: 'system', content: this.SYSTEM },
                        ...history,
                        { role: 'user', content: textContent },
                    ],
                    stream: true,
                });
                for await (const chunk of stream) {
                    const text = chunk.choices[0]?.delta?.content ?? '';
                    if (text) {
                        fullText += text;
                        send({ type: 'delta', text });
                    }
                }
                totalTokens = Math.ceil((userMessage.length + fullText.length) / 4);
            }
            else if (conv.provider === 'GEMINI') {
                const textContent = await this.buildTextContent(userMessage, file);
                const geminiModel = this.gemini.getGenerativeModel({
                    model: conv.model,
                    systemInstruction: this.SYSTEM,
                });
                const geminiHistory = history.map((m) => ({
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: m.content }],
                }));
                const chat = geminiModel.startChat({ history: geminiHistory });
                const result = await chat.sendMessageStream(textContent);
                for await (const chunk of result.stream) {
                    const text = chunk.text();
                    if (text) {
                        fullText += text;
                        send({ type: 'delta', text });
                    }
                }
                const finalResponse = await result.response;
                totalTokens = finalResponse.usageMetadata?.totalTokenCount
                    ?? Math.ceil((userMessage.length + fullText.length) / 4);
            }
            await this.prisma.$transaction([
                this.prisma.chatMessage.create({
                    data: {
                        conversationId,
                        userId,
                        role: 'assistant',
                        content: fullText,
                        model: conv.model,
                        tokens: totalTokens,
                    },
                }),
                this.prisma.conversation.update({
                    where: { id: conversationId },
                    data: { updatedAt: new Date() },
                }),
            ]);
            if (conv.messages.length === 0) {
                const title = (file ? `[${file.name}] ` : '') +
                    userMessage.trim().replace(/\s+/g, ' ').slice(0, 50);
                await this.prisma.conversation.update({
                    where: { id: conversationId },
                    data: { title: title || 'New conversation' },
                });
            }
            await this.billing.consume(userId, client_1.UsageType.CHAT, totalTokens, 0, conv.model);
            send({ type: 'done', tokens: totalTokens });
        }
        catch (err) {
            this.logger.error('Stream error', err);
            if (err instanceof common_1.ForbiddenException) {
                send({ type: 'error', message: err.message, statusCode: 403 });
            }
            else {
                send({ type: 'error', message: 'حدث خطأ أثناء المعالجة. حاول مرة أخرى.' });
            }
        }
        finally {
            res.end();
        }
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = ChatService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        billing_service_1.BillingService,
        config_1.ConfigService])
], ChatService);
//# sourceMappingURL=chat.service.js.map