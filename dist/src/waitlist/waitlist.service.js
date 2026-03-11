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
exports.WaitlistService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("../email/email.service");
const waitlist_email_template_1 = require("./waitlist-email.template");
const nanoid_1 = require("nanoid");
const nanoid = (0, nanoid_1.customAlphabet)('abcdefghijklmnopqrstuvwxyz0123456789', 8);
let WaitlistService = class WaitlistService {
    prisma;
    email;
    constructor(prisma, email) {
        this.prisma = prisma;
        this.email = email;
    }
    async join(dto) {
        const email = dto.email.toLowerCase().trim();
        const referralCode = nanoid();
        let referredBy = null;
        if (dto.ref) {
            const referrer = await this.prisma.waitlistEntry.findUnique({
                where: { referralCode: dto.ref },
                select: { email: true },
            });
            if (referrer)
                referredBy = referrer.email;
        }
        try {
            const entry = await this.prisma.waitlistEntry.create({
                data: {
                    email,
                    source: dto.source,
                    locale: dto.locale,
                    referralCode,
                    referredBy,
                },
                select: { id: true, email: true, referralCode: true },
            });
            await this.email.sendWaitlistConfirmation(email, (0, waitlist_email_template_1.waitlistEmailHtml)({ ctaUrl: 'https://linksy.dev/#how' }));
            return { created: true, entry };
        }
        catch (e) {
            if (e instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                e.code === 'P2002') {
                const entry = await this.prisma.waitlistEntry.findUnique({
                    where: { email },
                    select: { id: true, email: true },
                });
                return { created: false, entry: entry ?? { id: 'unknown', email } };
            }
            throw e;
        }
    }
    async getReferralStats(email) {
        const entry = await this.prisma.waitlistEntry.findUnique({
            where: { email: email.toLowerCase().trim() },
            select: { referralCode: true },
        });
        if (!entry)
            return { referralCode: '', referralCount: 0, referralLink: '' };
        const referralCount = await this.prisma.waitlistEntry.count({
            where: { referredBy: email.toLowerCase().trim() },
        });
        return {
            referralCode: entry.referralCode ?? '',
            referralCount,
            referralLink: `https://linksy.dev/?ref=${entry.referralCode}`,
        };
    }
};
exports.WaitlistService = WaitlistService;
exports.WaitlistService = WaitlistService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService])
], WaitlistService);
//# sourceMappingURL=waitlist.service.js.map