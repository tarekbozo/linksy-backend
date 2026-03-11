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
exports.BillingController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const billing_service_1 = require("./billing.service");
const select_plan_dto_1 = require("./dto/select-plan.dto");
const usage_dto_1 = require("./dto/usage.dto");
const confirm_order_dto_1 = require("./dto/confirm-order.dto");
const decorators_1 = require("../auth/decorators");
const throttler_1 = require("@nestjs/throttler");
let BillingController = class BillingController {
    billing;
    constructor(billing) {
        this.billing = billing;
    }
    listPlans() {
        return this.billing.listPlans();
    }
    myPass(user) {
        return this.billing.getMyPass(user.id);
    }
    status(user) {
        return this.billing.getUsageStatus(user.id);
    }
    select(user, dto) {
        return this.billing.selectPlan(user.id, dto.plan);
    }
    getOrder(id) {
        return this.billing.getOrderById(id);
    }
    getActivity(user, take = '10') {
        return this.billing.getActivity(user.id, +take);
    }
    confirmOrder(user, id, dto) {
        return this.billing.confirmOrder(user.id, id, dto.reference);
    }
    async check(user, dto) {
        return this.billing.canConsume(user.id, dto.type, dto.tokens, dto.images ?? 0);
    }
    async consume(user, dto) {
        return this.billing.consume(user.id, dto.type, dto.tokens, dto.images ?? 0, dto.model);
    }
};
exports.BillingController = BillingController;
__decorate([
    (0, common_1.Get)('plans'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "listPlans", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)('pass'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "myPass", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Get)('status'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "status", null);
__decorate([
    (0, common_1.Patch)('select'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, select_plan_dto_1.SelectPlanDto]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "select", null);
__decorate([
    (0, common_1.Get)('orders/:id'),
    (0, decorators_1.Roles)(client_1.Role.ADMIN, client_1.Role.AGENT),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "getOrder", null);
__decorate([
    (0, common_1.Get)('activity'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('take')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "getActivity", null);
__decorate([
    (0, common_1.Post)('orders/:id/confirm'),
    (0, decorators_1.Roles)(client_1.Role.ADMIN, client_1.Role.AGENT),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, confirm_order_dto_1.ConfirmOrderDto]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "confirmOrder", null);
__decorate([
    (0, common_1.Post)('usage/check'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, usage_dto_1.UsageCheckDto]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "check", null);
__decorate([
    (0, common_1.Post)('usage/consume'),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, usage_dto_1.UsageCheckDto]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "consume", null);
exports.BillingController = BillingController = __decorate([
    (0, common_1.Controller)('billing'),
    __metadata("design:paramtypes", [billing_service_1.BillingService])
], BillingController);
//# sourceMappingURL=billing.controller.js.map