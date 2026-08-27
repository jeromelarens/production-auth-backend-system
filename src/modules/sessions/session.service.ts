import { SessionRepository } from "./session.repository";
import { SessionResponseDTO } from "./session.types";
import { AuditService } from "../audit/audit.service";
import { AuditEventType } from "@prisma/client";
import { NotFoundError } from "../../errors/AuthError";
import { ForbiddenError } from "../../errors/AuthError";

export class SessionService {
  /**
   * Get all active sessions for a user.
   */
  static async getUserSessions(userId: string, currentSessionId?: string): Promise<SessionResponseDTO[]> {
    const sessions = await SessionRepository.findActiveByUserId(userId);
    return sessions.map((s) => ({
      id: s.id,
      deviceName: s.deviceName,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      lastUsedAt: s.lastUsedAt,
      expiresAt: s.expiresAt,
      isCurrent: currentSessionId ? s.id === currentSessionId : false,
    }));
  }

  /**
   * Revoke a single session with ownership validation.
   */
  static async revokeSession(userId: string, sessionId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    const session = await SessionRepository.findById(sessionId);

    if (!session) {
      throw new NotFoundError("Session not found");
    }

    if (session.userId !== userId) {
      throw new ForbiddenError("Cannot revoke another user's session");
    }

    if (!session.revokedAt) {
      await SessionRepository.revoke(sessionId);
      await AuditService.log({
        userId,
        event: AuditEventType.SESSION_REVOKED,
        ipAddress,
        userAgent,
        metadata: { sessionId },
      });
    }
  }

  /**
   * Revoke all sessions for a user (optionally keeping current).
   */
  static async revokeAllSessions(userId: string, exceptSessionId?: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await SessionRepository.revokeAllForUser(userId, exceptSessionId);

    await AuditService.log({
      userId,
      event: AuditEventType.LOGOUT_ALL,
      ipAddress,
      userAgent,
      metadata: { exceptSessionId },
    });
  }
}
