import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('me')
export class MeController {
  @UseGuards(JwtAuthGuard)
  @Get()
  getMe(@Req() req: any) {
    return {
      message: 'You are authenticated',
      user: req.user,
    };
  }
}
