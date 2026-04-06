import { Module } from "@nestjs/common";
import { BillingModule } from "../billing/billing.module";
import { StudyController } from "./study.controller";
import { StudyService } from "./study.service";

@Module({
  imports: [BillingModule],
  controllers: [StudyController],
  providers: [StudyService],
})
export class StudyModule {}
