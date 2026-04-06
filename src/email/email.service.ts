import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";
import {
  magicLinkEmailHtml,
  magicLinkEmailText,
} from "src/auth/magic-link-email.template";
import {
  passActivatedEmailHtml,
  passActivatedEmailText,
} from "src/billing/pass-activated-email.template";
import {
  waitlistEmailHtml,
  waitlistEmailText,
} from "src/waitlist/waitlist-email.template";
import { waitlistGoLiveEmailHtml } from "src/waitlist/Waitlist-golive-email";
import { waitlistLaunchEmailHtml } from "src/waitlist/waitlist-launch-email.template";
import { announcementEmailHtml } from "./announcement-email.template";

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {
    const key = this.config.get<string>("RESEND_API_KEY");
    if (!key)
      throw new InternalServerErrorException("RESEND_API_KEY is missing");
    this.resend = new Resend(key);
  }

  private from() {
    const from = this.config.get<string>("EMAIL_FROM");
    if (!from) throw new InternalServerErrorException("EMAIL_FROM is missing");
    return from;
  }

  async sendWaitlistConfirmation(toEmail: string, html: string) {
    const { error } = await this.resend.emails.send({
      from: this.from(),
      to: [toEmail],
      subject: "تم تأكيد إدراجك في قائمة الانتظار | LinkSy",
      html: waitlistEmailHtml({ ctaUrl: "https://linksy.dev/#how" }),
      text: waitlistEmailText(),
    });

    if (error) {
      // keep it generic; don't leak provider internals to clients
      throw new InternalServerErrorException(
        "Failed to send confirmation email",
      );
    }
  }

  async sendContactForm(
    name: string,
    from: string,
    subject: string,
    message: string,
  ) {
    await this.resend.emails.send({
      from: this.from(),
      to: "tarekbozo@gmail.com",
      replyTo: from,
      subject: `[Contact] ${subject}`,
      html: `
      <div dir="rtl">
        <p><b>الاسم:</b> ${name}</p>
        <p><b>البريد:</b> ${from}</p>
        <p><b>الموضوع:</b> ${subject}</p>
        <hr/>
        <p>${message.replace(/\n/g, "<br/>")}</p>
      </div>
    `,
    });
  }

  async sendBroadcast(
    toEmail: string,
    subject: string,
    html: string,
  ): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.from(),
      to: [toEmail],
      subject,
      html,
    });
    if (error) {
      this.logger.error(`Broadcast failed for ${toEmail}`, error);
    }
  }

  /**
   * Sends the launch announcement email to every address in the list.
   * Rate-limited to ~2 req/sec (500 ms gap) to stay within Resend free-tier limits.
   * Returns a summary { sent, failed }.
   */
  async sendAnnouncementBlast(
    emails: string[],
  ): Promise<{ sent: number; failed: number }> {
    const subject = "🚀 LinkSy — ميزات جديدة وأسعار محدّثة + عرض الإطلاق";
    const html = announcementEmailHtml();
    let sent = 0;
    let failed = 0;

    for (const email of emails) {
      const { error } = await this.resend.emails.send({
        from: this.from(),
        to: [email],
        subject,
        html,
      });
      if (error) {
        this.logger.error(`Announcement failed for ${email}`, error);
        failed++;
      } else {
        sent++;
      }
      // ~2 emails/sec — respect Resend rate limit on free/starter plans
      await new Promise((r) => setTimeout(r, 500));
    }

    this.logger.log(`Announcement blast done — sent: ${sent}, failed: ${failed}`);
    return { sent, failed };
  }

  async sendWaitlistLaunch(toEmail: string, refCode: string): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.from(),
      to: [toEmail],
      subject: "🚀 العد التنازلي بدأ — أنت من أوائل المسجلين في LinkSy",
      html: waitlistLaunchEmailHtml(refCode),
    });

    if (error) {
      this.logger.error(`Failed to send launch email to ${toEmail}`, error);
    }
  }

  async sendGoLive(toEmail: string, refCode: string): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.from(),
      to: [toEmail],
      subject: "🚀 LinkSy انطلق رسمياً — ابدأ الآن + خصم 15%",
      html: waitlistGoLiveEmailHtml(refCode),
    });
    if (error) {
      this.logger.error(`Failed to send go-live email to ${toEmail}`, error);
    }
  }

  async sendMagicLink(toEmail: string, link: string) {
    const { error } = await this.resend.emails.send({
      from: this.from(),
      to: [toEmail],
      subject: "رابط تسجيل الدخول | LinkSy",
      html: magicLinkEmailHtml({ loginUrl: link, locale: "ar" }),
      text: magicLinkEmailText({ loginUrl: link }),
    });

    if (error)
      throw new InternalServerErrorException("Failed to send login email");
  }
  async sendPassActivated(
    toEmail: string,
    plan: string,
    endsAt: Date,
  ): Promise<void> {
    const dashboardUrl =
      this.config.get<string>("FRONTEND_URL") + "/dashboard/overview";

    const { error } = await this.resend.emails.send({
      from: this.from(),
      to: [toEmail],
      subject: "✅ تم تفعيل باقتك | LinkSy",
      html: passActivatedEmailHtml({
        plan,
        endsAt: endsAt.toISOString(),
        dashboardUrl,
      }),
      text: passActivatedEmailText({
        plan,
        endsAt: endsAt.toISOString(),
        dashboardUrl,
      }),
    });

    if (error) {
      // Log but don't throw — activation already succeeded, email is best-effort
      this.logger.error(
        `Failed to send pass activation email to ${toEmail}`,
        error,
      );
    }
  }
}
