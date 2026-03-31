import { Module } from "@nestjs/common";
import { VoiceController } from "./voice.controller";
import { VoiceService } from "./voice.service";
import { PrismaModule } from "../prisma/prisma.module";
import { BillingModule } from "../billing/billing.module";

@Module({
  imports: [PrismaModule, BillingModule],
  controllers: [VoiceController],
  providers: [VoiceService],
})
export class VoiceModule {}
