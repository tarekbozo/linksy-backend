import { EmailService } from 'src/email/email.service';
export declare class ContactDto {
    name: string;
    email: string;
    subject?: string;
    message: string;
}
export declare class ContactController {
    private readonly email;
    constructor(email: EmailService);
    send(body: ContactDto): Promise<{
        ok: boolean;
    }>;
}
