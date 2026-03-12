import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { ChatModule } from "./chat/chat.module";
import { BillingModule } from "./billing/billing.module";
import { AgentsModule } from "./agents/agents.module";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthController } from "./health/health.controller";
import { WaitlistModule } from "./waitlist/waitlist.module";
import { MeController } from "./me/me.controller";
import { EmailModule } from "./email/email.module";
import { AuditModule } from "./audit/audit.module";
import { JwtAuthGuard } from "./auth/jwt-auth.guard";
import { RolesGuard } from "./auth/roles.guard";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { CsrfMiddleware } from "./common/middleware/csrf.middleware";
import { ImageModule } from "./image/image.module";
import { ContactController } from "./contact/contact.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [
        { name: "default", ttl: 60_000, limit: 300 },
        { name: "strict", ttl: 60_000, limit: 100 },
      ],
    }),
    PrismaModule,
    EmailModule,
    AuditModule,
    AuthModule,
    UsersModule,
    ChatModule,
    BillingModule,
    AgentsModule,
    WaitlistModule,
    ImageModule,
  ],
  controllers: [HealthController, MeController, ContactController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CsrfMiddleware)
      .exclude(
        { path: "health", method: RequestMethod.GET },
        { path: "api/v1/health", method: RequestMethod.GET },
        { path: "auth/csrf", method: RequestMethod.GET },
        { path: "api/v1/auth/csrf", method: RequestMethod.GET },
        { path: "auth/google/callback", method: RequestMethod.GET },
        { path: "api/v1/auth/google/callback", method: RequestMethod.GET },
        { path: "auth/github/callback", method: RequestMethod.GET },
        { path: "api/v1/auth/github/callback", method: RequestMethod.GET },
        { path: "auth/magic/verify", method: RequestMethod.POST },
        { path: "api/v1/auth/magic/verify", method: RequestMethod.POST },
        { path: "auth/refresh", method: RequestMethod.POST },
      )
      .forRoutes({ path: "*path", method: RequestMethod.ALL });
  }
}
