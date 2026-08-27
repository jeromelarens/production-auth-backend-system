import { RoleType } from "@prisma/client";
import { prisma, disconnectDatabase } from "../src/config/database";

async function main() {
  console.log("🌱 Seeding database roles and permissions...");

  // 1. Seed Roles
  const userRole = await prisma.role.upsert({
    where: { name: RoleType.USER },
    update: {},
    create: {
      name: RoleType.USER,
      description: "Standard registered user with default permissions",
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: RoleType.ADMIN },
    update: {},
    create: {
      name: RoleType.ADMIN,
      description: "Administrator with full system access",
    },
  });

  // 2. Seed Foundation Permissions
  const permissions = [
    { action: "users:read", description: "View user profiles" },
    { action: "users:update", description: "Update user profiles" },
    { action: "audit:view", description: "View security audit logs" },
    { action: "sessions:revoke", description: "Revoke user sessions" },
  ];

  for (const perm of permissions) {
    const createdPerm = await prisma.permission.upsert({
      where: { action: perm.action },
      update: {},
      create: perm,
    });

    // Assign all permissions to ADMIN role
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: createdPerm.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: createdPerm.id,
      },
    });
  }

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectDatabase();
  });
