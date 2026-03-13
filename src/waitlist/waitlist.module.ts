import { Module } from "@nestjs/common";
import { WaitlistController } from "./waitlist.controller";
import { WaitlistService } from "./waitlist.service";
import { EmailModule } from "src/email/email.module";
import { PrismaService } from "src/prisma/prisma.service";

@Module({
  imports: [EmailModule],
  controllers: [WaitlistController],
  providers: [WaitlistService, PrismaService],
})
export class WaitlistModule {}
