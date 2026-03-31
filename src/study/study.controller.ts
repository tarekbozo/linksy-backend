import { Body, Controller, Post } from "@nestjs/common";
import { AuthUser, CurrentUser } from "../auth/decorators";
import { StudyActionDto } from "./dto/study-action.dto";
import { StudyService } from "./study.service";

@Controller("study")
export class StudyController {
  constructor(private readonly study: StudyService) {}

  @Post("action")
  action(@CurrentUser() user: AuthUser, @Body() dto: StudyActionDto) {
    return this.study.processAction(
      user.id,
      dto.action,
      dto.textLength,
      dto.audioDurationSeconds,
    );
  }
}
