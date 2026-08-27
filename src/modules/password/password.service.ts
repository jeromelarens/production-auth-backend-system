import { prisma } from "../../config/database";
import { PasswordService as PasswordHasher } from "../../services/password.service";
import { generateRandomToken, hashToken } from "../../utils/crypto";
import { EmailService } from "../../services/email.service";
import { AuditService } from "../audit/audit.service";
import { SessionService } from "../sessions/session.service";
import { AuditEventType } from "@prisma/client";
import { AuthError } from "../../errors/AuthError";
import { ErrorCode } from "../../errors/error-codes";

export class PasswordManagementService {
  /**
   * Request a password reset. Returns generic message to prevent user enumeration.
   */
  static async requestPasswordReset(email: string, ipAddress?: string, userAgent?: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      // Do nothing, return silently to prevent enumeration
      return;
    }

    // Revoke previous unused reset tokens
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const rawToken = generateRandomToken(32);
    const tokenHash = hashToken(rawToken);

    // 1 hour expiry
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    await EmailService.sendPasswordResetEmail(user.email, user.firstName, rawToken);

    await AuditService.log({
      userId: user.id,
      event: AuditEventType.PASSWORD_RESET_REQUESTED,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Reset password using raw reset token.
   */
  static async resetPassword(rawToken: string, newPassword: string, ipAddress?: string, userAgent?: string): Promise<void> {
    const tokenHash = hashToken(rawToken);

    const tokenRecord = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!tokenRecord || !tokenRecord.user.isActive) {
      throw new AuthError("Invalid or expired password reset token", ErrorCode.AUTH_TOKEN_INVALID, 400);
    }

    const { user, id: tokenId } = tokenRecord;
    const newPasswordHash = await PasswordHasher.hash(newPassword);

    // Atomic update: update password, mark token used, revoke all active sessions
    await prisma.$transaction([
      prisma.passwordResetToken.update({
        where: { id: tokenId },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: newPasswordHash,
          passwordChangedAt: new Date(),
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      }),
      prisma.session.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await AuditService.log({
      userId: user.id,
      event: AuditEventType.PASSWORD_RESET_COMPLETED,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Change password for an authenticated user.
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    currentSessionId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new AuthError("User not found or inactive", ErrorCode.AUTH_ACCOUNT_INACTIVE);
    }

    const isMatch = await PasswordHasher.verify(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AuthError("Current password is incorrect", ErrorCode.AUTH_INVALID_CREDENTIALS, 400);
    }

    const newPasswordHash = await PasswordHasher.hash(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: newPasswordHash,
          passwordChangedAt: new Date(),
        },
      }),
      // Revoke all other sessions, keeping current session active
      prisma.session.updateMany({
        where: {
          userId,
          revokedAt: null,
          id: currentSessionId ? { not: currentSessionId } : undefined,
        },
        data: { revokedAt: new Date() },
      }),
    ]);

    await AuditService.log({
      userId,
      event: AuditEventType.PASSWORD_CHANGED,
      ipAddress,
      userAgent,
      metadata: { currentSessionKept: !!currentSessionId },
    });
  }
}
