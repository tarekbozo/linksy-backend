import { Response } from 'express';
import { AttachedFile, ChatService } from './chat.service';
import { AuthUser } from 'src/auth/decorators';
export declare class ChatController {
    private readonly chat;
    constructor(chat: ChatService);
    listModels(): {
        models: {
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
    };
    list(user: AuthUser): Promise<{
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
    create(user: AuthUser, body: {
        provider?: 'ANTHROPIC' | 'OPENAI';
        model?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        provider: import(".prisma/client").$Enums.AiProvider;
        model: string;
        title: string;
    }>;
    getOne(user: AuthUser, id: string): Promise<{
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
    remove(user: AuthUser, id: string): Promise<{
        ok: boolean;
    }>;
    updateTitle(user: AuthUser, id: string, body: {
        title: string;
    }): Promise<{
        ok: boolean;
    }>;
    stream(user: AuthUser, id: string, body: {
        message: string;
        file?: AttachedFile;
    }, res: Response): Promise<void>;
}
