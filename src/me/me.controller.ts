import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators";

@Controller("me")
export class MeController {
  @UseGuards(JwtAuthGuard)
  @Get()
  async me(
    @CurrentUser()
    user: {
      id: string;
      email: string;
      role: string;
      onboarded: boolean;
    },
  ) {
    return user;
  }
}
