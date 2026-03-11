import { Module } from "@nestjs/common";
import { WaitlistController } from "./waitlist.controller";
import { WaitlistService } from "./waitlist.service";
import { EmailModule } from "src/email/email.module";

@Module({
  imports: [EmailModule],
  controllers: [WaitlistController],
  providers: [WaitlistService],
})
export class WaitlistModule {}
