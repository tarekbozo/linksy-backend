import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ChatModule } from './chat/chat.module';
import { BillingModule } from './billing/billing.module';
import { AgentsModule } from './agents/agents.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health/health.controller';
import { MeController } from './me/me.controller';
import { WaitlistModule } from './waitlist/waitlist.module';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: 60,
          limit: 10,
        },
      ],
    }),
    AuthModule,
    UsersModule,
    ChatModule,
    BillingModule,
    AgentsModule,
    PrismaModule,
    WaitlistModule,
  ],
  controllers: [HealthController, MeController],
  providers: [],
})
export class AppModule {}
