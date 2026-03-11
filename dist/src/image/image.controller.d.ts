import { ImageService } from './image.service';
import { AuthUser } from 'src/auth/decorators';
export declare class GenerateImageDto {
    prompt: string;
    aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
}
export declare class ImageController {
    private readonly imageService;
    constructor(imageService: ImageService);
    generate(user: AuthUser, body: GenerateImageDto): Promise<{
        base64: string;
        mimeType: string;
        prompt: string;
        imagesUsed: number;
        imagesLimit: number;
        remaining: number;
    }>;
    status(user: AuthUser): Promise<{
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
    history(user: AuthUser): Promise<{
        id: string;
        createdAt: Date;
        prompt: string;
    }[]>;
}
