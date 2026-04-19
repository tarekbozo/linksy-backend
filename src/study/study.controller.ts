import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
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

  @Post("extract")
  @UseInterceptors(FileInterceptor("file"))
  extract(
    @CurrentUser() _user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.study.extractText(file);
  }
}
