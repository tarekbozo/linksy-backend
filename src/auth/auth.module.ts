import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./jwt.strategy";
import { AuthService } from "./auth.service";
import { EmailModule } from "../email/email.module";
import { PrismaModule } from "../prisma/prisma.module";
import { AuditModule } from "../audit/audit.module";
import { GoogleStrategy, GitHubStrategy } from "./strategies/oauth.strategies";

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ session: false }),
    PrismaModule,
    EmailModule,
    AuditModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_ACCESS_SECRET"),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, GitHubStrategy],
  exports: [AuthService],
})
export class AuthModule {}
