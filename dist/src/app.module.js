"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const chat_module_1 = require("./chat/chat.module");
const billing_module_1 = require("./billing/billing.module");
const agents_module_1 = require("./agents/agents.module");
const prisma_module_1 = require("./prisma/prisma.module");
const health_controller_1 = require("./health/health.controller");
const waitlist_module_1 = require("./waitlist/waitlist.module");
const me_controller_1 = require("./me/me.controller");
const email_module_1 = require("./email/email.module");
const audit_module_1 = require("./audit/audit.module");
const jwt_auth_guard_1 = require("./auth/jwt-auth.guard");
const roles_guard_1 = require("./auth/roles.guard");
const global_exception_filter_1 = require("./common/filters/global-exception.filter");
const csrf_middleware_1 = require("./common/middleware/csrf.middleware");
const image_module_1 = require("./image/image.module");
const contact_controller_1 = require("./contact/contact.controller");
let AppModule = class AppModule {
    configure(consumer) {
        consumer
            .apply(csrf_middleware_1.CsrfMiddleware)
            .exclude({ path: 'health', method: common_1.RequestMethod.GET }, { path: 'api/v1/health', method: common_1.RequestMethod.GET }, { path: 'auth/csrf', method: common_1.RequestMethod.GET }, { path: 'api/v1/auth/csrf', method: common_1.RequestMethod.GET }, { path: 'auth/google/callback', method: common_1.RequestMethod.GET }, { path: 'api/v1/auth/google/callback', method: common_1.RequestMethod.GET }, { path: 'auth/github/callback', method: common_1.RequestMethod.GET }, { path: 'api/v1/auth/github/callback', method: common_1.RequestMethod.GET }, { path: 'auth/magic/verify', method: common_1.RequestMethod.POST }, { path: 'api/v1/auth/magic/verify', method: common_1.RequestMethod.POST }, { path: 'auth/refresh', method: common_1.RequestMethod.POST })
            .forRoutes({ path: '*path', method: common_1.RequestMethod.ALL });
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            throttler_1.ThrottlerModule.forRoot({
                throttlers: [
                    { name: 'default', ttl: 60_000, limit: 60 },
                    { name: 'strict', ttl: 60_000, limit: 10 },
                ],
            }),
            prisma_module_1.PrismaModule,
            email_module_1.EmailModule,
            audit_module_1.AuditModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            chat_module_1.ChatModule,
            billing_module_1.BillingModule,
            agents_module_1.AgentsModule,
            waitlist_module_1.WaitlistModule,
            image_module_1.ImageModule,
        ],
        controllers: [health_controller_1.HealthController, me_controller_1.MeController, contact_controller_1.ContactController],
        providers: [
            { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard },
            { provide: core_1.APP_GUARD, useClass: jwt_auth_guard_1.JwtAuthGuard },
            { provide: core_1.APP_GUARD, useClass: roles_guard_1.RolesGuard },
            { provide: core_1.APP_FILTER, useClass: global_exception_filter_1.GlobalExceptionFilter },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map