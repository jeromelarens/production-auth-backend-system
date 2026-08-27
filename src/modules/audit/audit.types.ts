import { AuditEventType } from "@prisma/client";

export interface CreateAuditLogParams {
  userId?: string | null;
  event: AuditEventType;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, any> | null;
}
