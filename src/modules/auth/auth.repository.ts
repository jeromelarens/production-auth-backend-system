import { prisma } from "../../config/database";
import { RoleType } from "@prisma/client";

export class AuthRepository {
  static async findUserByEmail(email: string) {
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

  static async createUserWithDefaultRole(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
  }) {
    // Ensure default USER role exists
    const userRole = await prisma.role.upsert({
      where: { name: RoleType.USER },
      update: {},
      create: { name: RoleType.USER, description: "Default user role" },
    });

    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        roles: {
          create: [
            {
              roleId: userRole.id,
            },
          ],
        },
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }
}
