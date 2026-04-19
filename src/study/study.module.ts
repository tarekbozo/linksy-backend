import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { BillingModule } from "../billing/billing.module";
import { StudyController } from "./study.controller";
import { StudyService } from "./study.service";

@Module({
  imports: [BillingModule, MulterModule.register({ storage: memoryStorage() })],
  controllers: [StudyController],
  providers: [StudyService],
})
export class StudyModule {}
