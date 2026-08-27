import { VerificationRepository } from "./verification.repository";
import { generateRandomToken, hashToken } from "../../utils/crypto";
import { EmailService } from "../../services/email.service";
import { AuditService } from "../audit/audit.service";
import { AuditEventType } from "@prisma/client";
import { AuthError } from "../../errors/AuthError";
import { ErrorCode } from "../../errors/error-codes";
import { prisma } from "../../config/database";

export class VerificationService {
  /**
   * Create and send an email verification token.
   */
  static async sendVerification(userId: string, email: string, firstName: string, ipAddress?: string, userAgent?: string): Promise<void> {
    // Revoke previous unused verification tokens
    await VerificationRepository.revokeAllUserTokens(userId);

    const rawToken = generateRandomToken(32);
    const tokenHash = hashToken(rawToken);

    // 24 hour expiry
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await VerificationRepository.createToken({
      userId,
      tokenHash,
      expiresAt,
    });

    await EmailService.sendVerificationEmail(email, firstName, rawToken);

    await AuditService.log({
      userId,
      event: AuditEventType.REGISTER,
      ipAddress,
      userAgent,
      metadata: { action: "VERIFICATION_SENT" },
    });
  }

  /**
   * Verify an email address using the raw token.
   */
  static async verifyEmail(rawToken: string, ipAddress?: string, userAgent?: string): Promise<void> {
    const tokenHash = hashToken(rawToken);
    const verificationRecord = await VerificationRepository.findActiveTokenByHash(tokenHash);

    if (!verificationRecord) {
      throw new AuthError("Invalid or expired email verification token", ErrorCode.AUTH_TOKEN_INVALID, 400);
    }

    const { user, id: tokenId } = verificationRecord;

    if (user.isEmailVerified) {
      // Mark token used anyway
      await VerificationRepository.markTokenUsed(tokenId);
      return;
    }

    // Atomic transaction: mark token used and user email verified
    await prisma.$transaction([
      prisma.emailVerificationToken.update({
        where: { id: tokenId },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { isEmailVerified: true },
      }),
    ]);

    await AuditService.log({
      userId: user.id,
      event: AuditEventType.EMAIL_VERIFIED,
      ipAddress,
      userAgent,
    });
  }
}
