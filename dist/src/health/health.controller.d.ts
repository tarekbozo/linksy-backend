import { PrismaService } from '../prisma/prisma.service';
export declare class HealthController {
    private prisma;
    constructor(prisma: PrismaService);
    ok(): {
        status: string;
    };
    db(): Promise<{
        status: string;
        db: string;
    }>;
}
