import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { BillingService } from '../billing/billing.service';
import { Response } from 'express';
export type AiProvider = 'ANTHROPIC' | 'OPENAI' | 'GEMINI';
export declare const MODEL_OPTIONS: {
    ANTHROPIC: {
        id: string;
        label: string;
    }[];
    OPENAI: {
        id: string;
        label: string;
    }[];
    GEMINI: {
        id: string;
        label: string;
    }[];
};
export interface AttachedFile {
    name: string;
    mimeType: string;
    base64: string;
}
export declare class ChatService {
    private readonly prisma;
    private readonly billing;
    private readonly config;
    private readonly logger;
    private readonly anthropic;
    private readonly openai;
    private readonly gemini;
    private readonly SYSTEM;
    constructor(prisma: PrismaService, billing: BillingService, config: ConfigService);
    private isImage;
    private isCode;
    private extractText;
    private buildTextContent;
    private buildAnthropicContent;
    listConversations(userId: string): Promise<{
        id: string;
        updatedAt: Date;
        provider: import(".prisma/client").$Enums.AiProvider;
        model: string;
        title: string;
        messages: {
            role: string;
            content: string;
        }[];
    }[]>;
    getConversation(userId: string, conversationId: string): Promise<{
        messages: {
            id: string;
            createdAt: Date;
            role: string;
            tokens: number;
            model: string | null;
            content: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        provider: import(".prisma/client").$Enums.AiProvider;
        model: string;
        title: string;
    }>;
    createConversation(userId: string, provider?: AiProvider, model?: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        provider: import(".prisma/client").$Enums.AiProvider;
        model: string;
        title: string;
    }>;
    deleteConversation(userId: string, conversationId: string): Promise<{
        ok: boolean;
    }>;
    updateTitle(userId: string, conversationId: string, title: string): Promise<{
        ok: boolean;
    }>;
    streamChat(userId: string, conversationId: string, userMessage: string, res: Response, file?: AttachedFile): Promise<void>;
}
