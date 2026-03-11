import { WaitlistService } from './waitlist.service';
import { JoinWaitlistDto } from 'src/waitlist/dto/join-waitlist.dto';
export declare class WaitlistController {
    private readonly waitlistService;
    constructor(waitlistService: WaitlistService);
    join(dto: JoinWaitlistDto): Promise<{
        created: boolean;
        entry: Pick<import(".prisma/client").WaitlistEntry, "id" | "email">;
        ok: boolean;
    }>;
    referral(email: string): Promise<{
        referralCode: string;
        referralCount: number;
        referralLink: string;
        ok: boolean;
    }>;
}
