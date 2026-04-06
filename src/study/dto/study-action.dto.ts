import { IsEnum, IsInt, IsOptional, Min } from "class-validator";
import { StudyAction } from "../study-credits.calculator";

export class StudyActionDto {
  @IsEnum(StudyAction)
  action: StudyAction;

  @IsInt()
  @Min(0)
  textLength: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  audioDurationSeconds?: number;
}
