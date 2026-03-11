import { IsEnum } from "class-validator";
import { Plan } from "@prisma/client";

export class SelectPlanDto {
  @IsEnum(Plan)
  plan!: Plan;
}
