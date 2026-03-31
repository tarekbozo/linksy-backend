import { Injectable } from "@nestjs/common";
import { ActionType } from "@prisma/client";
import { BillingService } from "../billing/billing.service";
import {
  StudyAction,
  calculateStudyCredits,
} from "./study-credits.calculator";

@Injectable()
export class StudyService {
  constructor(private readonly billing: BillingService) {}

  async processAction(
    userId: string,
    action: StudyAction,
    textLength: number,
    audioDurationSeconds?: number,
  ) {
    const credits = calculateStudyCredits(action, textLength, audioDurationSeconds);
    return this.billing.deductFixed(userId, credits, ActionType.STUDY, {
      studyAction: action,
      textLength,
      ...(audioDurationSeconds !== undefined && { audioDurationSeconds }),
    });
  }
}
