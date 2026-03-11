import { Injectable } from "@nestjs/common";
import { Prisma, WaitlistEntry } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { JoinWaitlistDto } from "src/waitlist/dto/join-waitlist.dto";
import { EmailService } from "src/email/email.service";
import { waitlistEmailHtml } from "./waitlist-email.template";
import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8);

@Injectable()
export class WaitlistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  /**
   * Adds user to waitlist.
   * Returns { created: boolean } so later we can send email only on first signup.
   */
  async join(
    dto: JoinWaitlistDto,
  ): Promise<{ created: boolean; entry: Pick<WaitlistEntry, "id" | "email"> }> {
    const email = dto.email.toLowerCase().trim();

    const referralCode = nanoid();

    let referredBy: string | null = null;
    if (dto.ref) {
      const referrer = await this.prisma.waitlistEntry.findUnique({
        where: { referralCode: dto.ref },
        select: { email: true },
      });
      if (referrer) referredBy = referrer.email;
    }

    try {
      const entry = await this.prisma.waitlistEntry.create({
        data: {
          email,
          source: dto.source,
          locale: dto.locale,
          referralCode,
          referredBy,
        },
        select: { id: true, email: true, referralCode: true },
      });
      await this.email.sendWaitlistConfirmation(
        email,
        waitlistEmailHtml({ ctaUrl: "https://linksy.dev/#how" }),
      );

      return { created: true, entry };
    } catch (e) {
      // If duplicate email, return ok but created=false
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        const entry = await this.prisma.waitlistEntry.findUnique({
          where: { email },
          select: { id: true, email: true },
        });

        // entry should exist, but just in case
        return { created: false, entry: entry ?? { id: "unknown", email } };
      }

      throw e;
    }
  }

  async getReferralStats(email: string) {
    const entry = await this.prisma.waitlistEntry.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { referralCode: true },
    });

    if (!entry) return { referralCode: "", referralCount: 0, referralLink: "" };

    const referralCount = await this.prisma.waitlistEntry.count({
      where: { referredBy: email.toLowerCase().trim() },
    });

    return {
      referralCode: entry.referralCode ?? "",
      referralCount,
      referralLink: `https://linksy.dev/?ref=${entry.referralCode}`,
    };
  }
}
