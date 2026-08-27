import { prisma } from "../../config/database";
import { CreateAuditLogParams } from "./audit.types";

export class AuditRepository {
  static async create(params: CreateAuditLogParams) {
    return prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        event: params.event,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : undefined,
      },
    });
  }

  static async findByUserId(userId: string, limit: number = 20) {
    return prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}
