import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";
import { env } from "./env";

declare global {
  var __prisma: PrismaClient | undefined;
}

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

const adapter = new PrismaPg(pool as any);

export const prisma =
  global.__prisma ||
  new PrismaClient({
    adapter,
    log:
      env.NODE_ENV === "development"
        ? [
            { emit: "event", level: "error" },
            { emit: "event", level: "warn" },
          ]
        : [{ emit: "event", level: "error" }],
  });

if (env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

(prisma as any).$on("error", (e: any) => {
  logger.error(`Prisma Error: ${e.message}`);
});

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info("[DATABASE] PostgreSQL connected successfully via Prisma");
  } catch (error: any) {
    logger.error(`[DATABASE] Failed to connect to PostgreSQL: ${error.message}`);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  await pool.end();
  logger.info("[DATABASE] PostgreSQL disconnected");
}
