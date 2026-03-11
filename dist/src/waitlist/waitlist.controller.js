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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaitlistController = void 0;
const common_1 = require("@nestjs/common");
const waitlist_service_1 = require("./waitlist.service");
const join_waitlist_dto_1 = require("./dto/join-waitlist.dto");
const throttler_1 = require("@nestjs/throttler");
const decorators_1 = require("../auth/decorators");
let WaitlistController = class WaitlistController {
    waitlistService;
    constructor(waitlistService) {
        this.waitlistService = waitlistService;
    }
    async join(dto) {
        const result = await this.waitlistService.join(dto);
        return { ok: true, ...result };
    }
    async referral(email) {
        const stats = await this.waitlistService.getReferralStats(email);
        return { ok: true, ...stats };
    }
};
exports.WaitlistController = WaitlistController;
__decorate([
    (0, common_1.Post)('join'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [join_waitlist_dto_1.JoinWaitlistDto]),
    __metadata("design:returntype", Promise)
], WaitlistController.prototype, "join", null);
__decorate([
    (0, common_1.Get)('referral'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Query)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WaitlistController.prototype, "referral", null);
exports.WaitlistController = WaitlistController = __decorate([
    (0, decorators_1.Public)(),
    (0, throttler_1.Throttle)({
        default: { limit: 3, ttl: 60 },
    }),
    (0, common_1.Controller)('waitlist'),
    __metadata("design:paramtypes", [waitlist_service_1.WaitlistService])
], WaitlistController);
//# sourceMappingURL=waitlist.controller.js.map