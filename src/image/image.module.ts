// src/image/image.module.ts
import { Module } from "@nestjs/common";
import { ImageService } from "./image.service";
import { ImageController } from "./image.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { BillingModule } from "src/billing/billing.module";

@Module({
  imports: [PrismaModule, BillingModule],
  controllers: [ImageController],
  providers: [ImageService],
})
export class ImageModule {}
