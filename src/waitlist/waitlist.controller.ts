import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { WaitlistService } from './waitlist.service';
import { JoinWaitlistDto } from 'src/waitlist/dto/join-waitlist.dto';
import { Throttle } from '@nestjs/throttler';

@Throttle({
  default: { limit: 3, ttl: 60 },
})
@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post('join')
  @HttpCode(200)
  async join(@Body() dto: JoinWaitlistDto) {
    const result = await this.waitlistService.join(dto);
    return { ok: true, ...result };
  }
}
