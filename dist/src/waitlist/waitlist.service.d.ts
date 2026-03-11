import { WaitlistEntry } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JoinWaitlistDto } from 'src/waitlist/dto/join-waitlist.dto';
import { EmailService } from 'src/email/email.service';
export declare class WaitlistService {
    private readonly prisma;
    private readonly email;
    constructor(prisma: PrismaService, email: EmailService);
    join(dto: JoinWaitlistDto): Promise<{
        created: boolean;
        entry: Pick<WaitlistEntry, 'id' | 'email'>;
    }>;
    getReferralStats(email: string): Promise<{
        referralCode: string;
        referralCount: number;
        referralLink: string;
    }>;
}
