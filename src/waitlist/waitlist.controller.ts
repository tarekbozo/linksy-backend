import { Body, Controller, Get, HttpCode, Post, Query } from "@nestjs/common";
import { WaitlistService } from "./waitlist.service";
import { JoinWaitlistDto } from "src/waitlist/dto/join-waitlist.dto";
import { Throttle } from "@nestjs/throttler";
import { Public, Roles } from "src/auth/decorators";
import { EmailService } from "src/email/email.service";
import { PrismaService } from "src/prisma/prisma.service";
import { Role } from "@prisma/client";

@Throttle({ default: { limit: 3, ttl: 60 } })
@Controller("waitlist")
export class WaitlistController {
  constructor(
    private readonly waitlistService: WaitlistService,
    private readonly prisma: PrismaService, // ← properly injected
    private readonly email: EmailService, // ← properly injected
  ) {}

  @Public()
  @Post("join")
  @HttpCode(200)
  async join(@Body() dto: JoinWaitlistDto) {
    const result = await this.waitlistService.join(dto);
    return { ok: true, ...result };
  }

  @Get("referral")
  @HttpCode(200)
  async referral(@Query("email") email: string) {
    const stats = await this.waitlistService.getReferralStats(email);
    return { ok: true, ...stats };
  }

  @Post("blast")
  @Roles(Role.ADMIN)
  async sendLaunchBlast() {
    const entries = await this.prisma.waitlistEntry.findMany({
      select: { email: true },
    });

    let sent = 0;
    let failed = 0;

    for (const entry of entries) {
      // Generate a simple ref code from email
      const refCode = Buffer.from(entry.email)
        .toString("base64")
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 10)
        .toUpperCase();

      try {
        await this.email.sendWaitlistLaunch(entry.email, refCode);
        sent++;
        // Small delay to avoid rate limiting Resend
        await new Promise((r) => setTimeout(r, 200));
      } catch {
        failed++;
      }
    }

    return { sent, failed, total: entries.length };
  }

  @Post("golive")
  @Roles(Role.ADMIN)
  async sendGoLiveBlast() {
    const entries = await this.prisma.waitlistEntry.findMany({
      select: { email: true, id: true },
    });

    let sent = 0;
    let failed = 0;

    for (const entry of entries) {
      try {
        await this.email.sendGoLive(entry.email, "LAUNCH16");
        sent++;
        await new Promise((r) => setTimeout(r, 200));
      } catch {
        failed++;
      }
    }

    return { sent, failed, total: entries.length };
  }

  @Post("resend-failed")
  @Roles(Role.ADMIN)
  async resendFailed(@Body() dto: { emails: string[] }) {
    let sent = 0;
    let failed = 0;
    for (const email of dto.emails) {
      try {
        await this.email.sendGoLive(email, "LAUNCH15");
        sent++;
        await new Promise((r) => setTimeout(r, 600));
      } catch {
        failed++;
      }
    }
    return { sent, failed };
  }

  @Post("broadcast")
  @Roles(Role.ADMIN)
  async broadcast(@Body() dto: { subject: string; html: string }) {
    const users = await this.prisma.user.findMany({
      select: { email: true },
    });

    let sent = 0;
    let failed = 0;

    for (const user of users) {
      try {
        await this.email.sendBroadcast(user.email, dto.subject, dto.html);
        sent++;
        await new Promise((r) => setTimeout(r, 200));
      } catch {
        failed++;
      }
    }

    return { sent, failed, total: users.length };
  }
}
