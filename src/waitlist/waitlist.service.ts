import { Injectable } from '@nestjs/common';
import { Prisma, WaitlistEntry } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JoinWaitlistDto } from 'src/waitlist/dto/join-waitlist.dto';
import { EmailService } from 'src/email/email.service';
import { waitlistEmailHtml } from './waitlist-email.template';

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
  ): Promise<{ created: boolean; entry: Pick<WaitlistEntry, 'id' | 'email'> }> {
    const email = dto.email.toLowerCase().trim();

    try {
      const entry = await this.prisma.waitlistEntry.create({
        data: {
          email,
          source: dto.source,
          locale: dto.locale,
        },
        select: { id: true, email: true },
      });
      await this.email.sendWaitlistConfirmation(
        email,
        waitlistEmailHtml({ ctaUrl: 'https://linksy.dev/#how' }),
      );

      return { created: true, entry };
    } catch (e) {
      // If duplicate email, return ok but created=false
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        const entry = await this.prisma.waitlistEntry.findUnique({
          where: { email },
          select: { id: true, email: true },
        });

        // entry should exist, but just in case
        return { created: false, entry: entry ?? { id: 'unknown', email } };
      }

      throw e;
    }
  }
}
