import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Public } from "src/auth/decorators";

@Controller("health")
@Public()
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  ok() {
    return { status: "ok" };
  }

  @Get("db")
  async db() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: "ok", db: "connected" };
  }
}
