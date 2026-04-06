import { ForbiddenException, Injectable } from "@nestjs/common";
import { ActionType } from "@prisma/client";
import { BillingService } from "../billing/billing.service";
import { PLAN_CONFIG } from "../billing/billing.plans";
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
    const status = await this.billing.getStatus(userId);
    if (!status.features.includes("summarize")) {
      throw new ForbiddenException(
        "مساعد الدراسة متاح من باقة الطالب فأعلى.",
      );
    }

    const credits = calculateStudyCredits(action, textLength, audioDurationSeconds);
    return this.billing.deductFixed(userId, credits, ActionType.STUDY, {
      studyAction: action,
      textLength,
      ...(audioDurationSeconds !== undefined && { audioDurationSeconds }),
    });
  }
}
