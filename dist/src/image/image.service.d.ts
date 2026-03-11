import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
export declare class ImageService {
    private readonly prisma;
    private readonly config;
    private readonly ai;
    constructor(prisma: PrismaService, config: ConfigService);
    generate(userId: string, prompt: string, aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3'): Promise<{
        base64: string;
        mimeType: string;
        prompt: string;
        imagesUsed: number;
        imagesLimit: number;
        remaining: number;
    }>;
    getStatus(userId: string): Promise<{
        plan: string;
        limit: number;
        used: number;
        remaining: number;
        hasAccess: boolean;
        expiresAt?: undefined;
    } | {
        plan: import(".prisma/client").$Enums.Plan;
        limit: number;
        used: number;
        remaining: number;
        hasAccess: boolean;
        expiresAt: Date;
    }>;
    getHistory(userId: string, take?: number): Promise<{
        id: string;
        createdAt: Date;
        prompt: string;
    }[]>;
}
