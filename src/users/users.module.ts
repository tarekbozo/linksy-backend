import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { AuditModule } from "src/audit/audit.module";
import { EmailModule } from "src/email/email.module";

@Module({
  imports: [AuditModule, EmailModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
