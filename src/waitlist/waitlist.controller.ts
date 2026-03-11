import { Body, Controller, Get, HttpCode, Post, Query } from "@nestjs/common";
import { WaitlistService } from "./waitlist.service";
import { JoinWaitlistDto } from "src/waitlist/dto/join-waitlist.dto";
import { Throttle } from "@nestjs/throttler";
import { Public } from "src/auth/decorators";

@Public()
@Throttle({
  default: { limit: 3, ttl: 60 },
})
@Controller("waitlist")
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

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
}
