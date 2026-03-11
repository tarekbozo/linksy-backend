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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const decorators_1 = require("../auth/decorators");
const ListUsersDto_1 = require("./dto/ListUsersDto");
const users_service_1 = require("./users.service");
const SetRoleDto_1 = require("./dto/SetRoleDto");
const SetActiveDto_1 = require("./dto/SetActiveDto");
const roles_guard_1 = require("../auth/roles.guard");
let UsersController = class UsersController {
    users;
    constructor(users) {
        this.users = users;
    }
    findAll(query) {
        return this.users.findAll({
            role: query.role,
            search: query.search,
            skip: query.skip ? Number(query.skip) : 0,
            take: query.take ? Number(query.take) : 50,
        });
    }
    findOne(id) {
        return this.users.findOne(id);
    }
    setRole(id, dto, actor) {
        return this.users.setRole(id, dto.role, actor.id);
    }
    setActive(id, dto, actor) {
        return this.users.setActive(id, dto.isActive, actor.id);
    }
    getOrderById(orderId) {
        return this.users.getOrderById(orderId);
    }
    getAgentOrders(agent) {
        return this.users.getAgentOrders(agent.id);
    }
    getAgentStats(agent) {
        return this.users.getAgentStats(agent.id);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)(),
    (0, decorators_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ListUsersDto_1.ListUsersDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, decorators_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/role'),
    (0, decorators_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, SetRoleDto_1.SetRoleDto, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "setRole", null);
__decorate([
    (0, common_1.Patch)(':id/active'),
    (0, decorators_1.Roles)(client_1.Role.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, SetActiveDto_1.SetActiveDto, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "setActive", null);
__decorate([
    (0, common_1.Get)('agent/order/:orderId'),
    (0, decorators_1.Roles)(client_1.Role.ADMIN, client_1.Role.AGENT),
    __param(0, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getOrderById", null);
__decorate([
    (0, common_1.Get)('agent/orders'),
    (0, decorators_1.Roles)(client_1.Role.ADMIN, client_1.Role.AGENT),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getAgentOrders", null);
__decorate([
    (0, common_1.Get)('agent/stats'),
    (0, decorators_1.Roles)(client_1.Role.ADMIN, client_1.Role.AGENT),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getAgentStats", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map