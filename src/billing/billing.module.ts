import { Module } from "@nestjs/common";
import { BillingController } from "./billing.controller";
import { BillingService } from "./billing.service";
import { PrismaService } from "../prisma/prisma.service";
import { AuditModule } from "../audit/audit.module";
import { EmailModule } from "src/email/email.module";

@Module({
  imports: [AuditModule, EmailModule],
  controllers: [BillingController],
  providers: [BillingService, PrismaService],
  exports: [BillingService],
})
export class BillingModule {}
