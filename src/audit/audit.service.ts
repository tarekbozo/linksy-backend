import { Injectable, Logger } from "@nestjs/common";
import { AuditAction } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

interface LogOptions {
  userId?: string;
  actorId?: string;
  action: AuditAction;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(data: {
    userId: string;
    action: AuditAction;
    actorId?: string;
    metadata?: any;
  }) {
    try {
      await this.prisma.auditLog.create({ data });
    } catch (err) {
      // Never let audit logging break the main flow
      console.warn("Audit log failed (non-fatal):", err);
    }
  }
}
