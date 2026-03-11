import { ConfigService } from '@nestjs/config';
export declare class EmailService {
    private readonly config;
    private readonly resend;
    private readonly logger;
    constructor(config: ConfigService);
    private from;
    sendWaitlistConfirmation(toEmail: string, html: string): Promise<void>;
    sendContactForm(name: string, from: string, subject: string, message: string): Promise<void>;
    sendMagicLink(toEmail: string, link: string): Promise<void>;
    sendPassActivated(toEmail: string, plan: string, endsAt: Date): Promise<void>;
}
