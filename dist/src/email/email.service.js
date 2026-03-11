"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const resend_1 = require("resend");
const magic_link_email_template_1 = require("../auth/magic-link-email.template");
const pass_activated_email_template_1 = require("../billing/pass-activated-email.template");
const waitlist_email_template_1 = require("../waitlist/waitlist-email.template");
let EmailService = EmailService_1 = class EmailService {
    config;
    resend;
    logger = new common_1.Logger(EmailService_1.name);
    constructor(config) {
        this.config = config;
        const key = this.config.get('RESEND_API_KEY');
        if (!key)
            throw new common_1.InternalServerErrorException('RESEND_API_KEY is missing');
        this.resend = new resend_1.Resend(key);
    }
    from() {
        const from = this.config.get('EMAIL_FROM');
        if (!from)
            throw new common_1.InternalServerErrorException('EMAIL_FROM is missing');
        return from;
    }
    async sendWaitlistConfirmation(toEmail, html) {
        const { error } = await this.resend.emails.send({
            from: this.from(),
            to: [toEmail],
            subject: 'تم تأكيد إدراجك في قائمة الانتظار | LinkSy',
            html: (0, waitlist_email_template_1.waitlistEmailHtml)({ ctaUrl: 'https://linksy.dev/#how' }),
            text: (0, waitlist_email_template_1.waitlistEmailText)(),
        });
        if (error) {
            throw new common_1.InternalServerErrorException('Failed to send confirmation email');
        }
    }
    async sendContactForm(name, from, subject, message) {
        await this.resend.emails.send({
            from: this.from(),
            to: 'tarekbozo@gmail.com',
            replyTo: from,
            subject: `[Contact] ${subject}`,
            html: `
      <div dir="rtl">
        <p><b>الاسم:</b> ${name}</p>
        <p><b>البريد:</b> ${from}</p>
        <p><b>الموضوع:</b> ${subject}</p>
        <hr/>
        <p>${message.replace(/\n/g, '<br/>')}</p>
      </div>
    `,
        });
    }
    async sendMagicLink(toEmail, link) {
        const { error } = await this.resend.emails.send({
            from: this.from(),
            to: [toEmail],
            subject: 'رابط تسجيل الدخول | LinkSy',
            html: (0, magic_link_email_template_1.magicLinkEmailHtml)({ loginUrl: link, locale: 'ar' }),
            text: (0, magic_link_email_template_1.magicLinkEmailText)({ loginUrl: link }),
        });
        if (error)
            throw new common_1.InternalServerErrorException('Failed to send login email');
    }
    async sendPassActivated(toEmail, plan, endsAt) {
        const dashboardUrl = this.config.get('FRONTEND_URL') + '/dashboard/overview';
        const { error } = await this.resend.emails.send({
            from: this.from(),
            to: [toEmail],
            subject: '✅ تم تفعيل باقتك | LinkSy',
            html: (0, pass_activated_email_template_1.passActivatedEmailHtml)({
                plan,
                endsAt: endsAt.toISOString(),
                dashboardUrl,
            }),
            text: (0, pass_activated_email_template_1.passActivatedEmailText)({
                plan,
                endsAt: endsAt.toISOString(),
                dashboardUrl,
            }),
        });
        if (error) {
            this.logger.error(`Failed to send pass activation email to ${toEmail}`, error);
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map