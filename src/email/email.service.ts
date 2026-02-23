import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import {
  waitlistEmailHtml,
  waitlistEmailText,
} from 'src/waitlist/waitlist-email.template';

@Injectable()
export class EmailService {
  private readonly resend: Resend;

  constructor(private readonly config: ConfigService) {
    const key = this.config.get<string>('RESEND_API_KEY');
    if (!key)
      throw new InternalServerErrorException('RESEND_API_KEY is missing');
    this.resend = new Resend(key);
  }

  private from() {
    const from = this.config.get<string>('EMAIL_FROM');
    if (!from) throw new InternalServerErrorException('EMAIL_FROM is missing');
    return from;
  }

  async sendWaitlistConfirmation(toEmail: string, html: string) {
    const { error } = await this.resend.emails.send({
      from: this.from(),
      to: [toEmail],
      subject: 'تم تأكيد إدراجك في قائمة الانتظار | LinkSy',
      html: waitlistEmailHtml({ ctaUrl: 'https://linksy.dev/#how' }),
      text: waitlistEmailText(),
    });

    if (error) {
      // keep it generic; don't leak provider internals to clients
      throw new InternalServerErrorException(
        'Failed to send confirmation email',
      );
    }
  }
}
