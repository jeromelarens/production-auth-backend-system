import { prisma } from "../../config/database";
import { CreateSessionParams } from "./session.types";

export class SessionRepository {
  static async create(params: CreateSessionParams) {
    return prisma.session.create({
      data: {
        userId: params.userId,
        refreshTokenHash: params.refreshTokenHash,
        deviceName: params.deviceName || null,
        userAgent: params.userAgent || null,
        ipAddress: params.ipAddress || null,
        expiresAt: params.expiresAt,
      },
    });
  }

  static async findByRefreshTokenHash(refreshTokenHash: string) {
    return prisma.session.findUnique({
      where: { refreshTokenHash },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });
  }

  static async findActiveByUserId(userId: string) {
    return prisma.session.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastUsedAt: "desc" },
    });
  }

  static async findById(id: string) {
    return prisma.session.findUnique({
      where: { id },
    });
  }

  /**
   * Rotate session: atomically revoke current session and create new session in the family.
   */
  static async rotateSession(
    oldSessionId: string,
    newParams: CreateSessionParams
  ) {
    return prisma.$transaction([
      prisma.session.update({
        where: { id: oldSessionId },
        data: {
          revokedAt: new Date(),
          lastUsedAt: new Date(),
        },
      }),
      prisma.session.create({
        data: {
          userId: newParams.userId,
          refreshTokenHash: newParams.refreshTokenHash,
          deviceName: newParams.deviceName || null,
          userAgent: newParams.userAgent || null,
          ipAddress: newParams.ipAddress || null,
          expiresAt: newParams.expiresAt,
        },
      }),
    ]);
  }

  static async revoke(sessionId: string) {
    return prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  static async revokeAllForUser(userId: string, exceptSessionId?: string) {
    return prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
        id: exceptSessionId ? { not: exceptSessionId } : undefined,
      },
      data: { revokedAt: new Date() },
    });
  }
}
