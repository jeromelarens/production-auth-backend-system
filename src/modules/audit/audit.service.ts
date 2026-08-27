import { AuditRepository } from "./audit.repository";
import { CreateAuditLogParams } from "./audit.types";
import { logger } from "../../config/logger";

export class AuditService {
  /**
   * Log a security event safely. Never throws to avoid blocking user flows.
   */
  static async log(params: CreateAuditLogParams): Promise<void> {
    try {
      // Remove any sensitive keys if present in metadata
      const sanitizedMeta = params.metadata ? { ...params.metadata } : {};
      delete sanitizedMeta.password;
      delete sanitizedMeta.token;
      delete sanitizedMeta.refreshToken;
      delete sanitizedMeta.currentPassword;
      delete sanitizedMeta.newPassword;

      await AuditRepository.create({
        ...params,
        metadata: Object.keys(sanitizedMeta).length > 0 ? sanitizedMeta : null,
      });

      logger.info(`[AUDIT] Event: ${params.event} | User: ${params.userId || "anonymous"} | IP: ${params.ipAddress || "unknown"}`);
    } catch (err: any) {
      logger.error(`[AUDIT] Failed to write audit log: ${err.message}`);
    }
  }

  static async getUserLogs(userId: string) {
    return AuditRepository.findByUserId(userId);
  }
}
