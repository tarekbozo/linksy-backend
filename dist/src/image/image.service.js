"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const config_1 = require("@nestjs/config");
const genai_1 = require("@google/genai");
let ImageService = class ImageService {
    prisma;
    config;
    ai;
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
        this.ai = new genai_1.GoogleGenAI({
            apiKey: this.config.get('GEMINI_API_KEY'),
        });
    }
    async generate(userId, prompt, aspectRatio = '1:1') {
        if (!prompt?.trim())
            throw new common_1.BadRequestException('Prompt is required');
        const pass = await this.prisma.pass.findUnique({ where: { userId } });
        if (!pass) {
            throw new common_1.ForbiddenException('No active pass found');
        }
        if (pass.imageCap === 0) {
            throw new common_1.ForbiddenException('Image generation requires PRO or ELITE plan');
        }
        if (new Date() > pass.endsAt) {
            throw new common_1.ForbiddenException('Your pass has expired. Please renew to generate images.');
        }
        if (pass.imagesUsed >= pass.imageCap) {
            throw new common_1.ForbiddenException(`لقد استنفذت حصتك الشهرية من الصور (${pass.imageCap} صورة). تتجدد مع باقتك القادمة.`);
        }
        try {
            const response = await this.ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt.trim(),
                config: {
                    numberOfImages: 1,
                    aspectRatio,
                    outputMimeType: 'image/jpeg',
                },
            });
            const generatedImage = response.generatedImages?.[0];
            if (!generatedImage?.image?.imageBytes) {
                throw new common_1.BadRequestException('No image returned from API');
            }
            const rawBytes = generatedImage.image.imageBytes;
            const base64 = typeof rawBytes === 'string'
                ? rawBytes
                : Buffer.from(rawBytes).toString('base64');
            await Promise.all([
                this.prisma.pass.update({
                    where: { userId },
                    data: { imagesUsed: { increment: 1 } },
                }),
                this.prisma.generatedImage.create({
                    data: { userId, prompt: prompt.trim(), model: 'imagen-4.0-generate-001' },
                }),
                this.prisma.usageLog.create({
                    data: { userId, type: 'IMAGE', model: 'imagen-4.0-generate-001', images: 1 },
                }),
            ]);
            return {
                base64,
                mimeType: 'image/jpeg',
                prompt: prompt.trim(),
                imagesUsed: pass.imagesUsed + 1,
                imagesLimit: pass.imageCap,
                remaining: pass.imageCap - (pass.imagesUsed + 1),
            };
        }
        catch (err) {
            if (err instanceof common_1.ForbiddenException || err instanceof common_1.BadRequestException)
                throw err;
            throw new common_1.BadRequestException(err?.message ?? 'Image generation failed');
        }
    }
    async getStatus(userId) {
        const pass = await this.prisma.pass.findUnique({ where: { userId } });
        if (!pass) {
            return { plan: 'FREE', limit: 0, used: 0, remaining: 0, hasAccess: false };
        }
        const expired = new Date() > pass.endsAt;
        return {
            plan: pass.plan,
            limit: pass.imageCap,
            used: pass.imagesUsed,
            remaining: expired ? 0 : Math.max(0, pass.imageCap - pass.imagesUsed),
            hasAccess: pass.imageCap > 0 && !expired,
            expiresAt: pass.endsAt,
        };
    }
    async getHistory(userId, take = 20) {
        return this.prisma.generatedImage.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take,
            select: { id: true, prompt: true, createdAt: true },
        });
    }
};
exports.ImageService = ImageService;
exports.ImageService = ImageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], ImageService);
//# sourceMappingURL=image.service.js.map