import { prisma } from "../../config/database";

export class UserRepository {
  static async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  static async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  static async incrementFailedAttempts(userId: string, lockoutMinutes: number = 15, maxAttempts: number = 5) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { failedLoginAttempts: true },
    });

    if (!user) return;

    const newAttempts = user.failedLoginAttempts + 1;
    let lockedUntil: Date | null = null;

    if (newAttempts >= maxAttempts) {
      lockedUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000);
    }

    return prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: newAttempts,
        lockedUntil,
      },
    });
  }

  static async resetFailedAttemptsAndSetLogin(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });
  }
}
