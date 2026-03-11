import { AuditAction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuditService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    log(data: {
        userId: string;
        action: AuditAction;
        actorId?: string;
        metadata?: any;
    }): Promise<void>;
}
