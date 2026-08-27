import { prisma } from "../../config/database";
import { CreateVerificationTokenParams } from "./verification.types";

export class VerificationRepository {
  static async createToken(params: CreateVerificationTokenParams) {
    return prisma.emailVerificationToken.create({
      data: {
        userId: params.userId,
        tokenHash: params.tokenHash,
        expiresAt: params.expiresAt,
      },
    });
  }

  static async findActiveTokenByHash(tokenHash: string) {
    return prisma.emailVerificationToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: true,
      },
    });
  }

  static async markTokenUsed(tokenId: string) {
    return prisma.emailVerificationToken.update({
      where: { id: tokenId },
      data: { usedAt: new Date() },
    });
  }

  static async revokeAllUserTokens(userId: string) {
    return prisma.emailVerificationToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
  }
}
