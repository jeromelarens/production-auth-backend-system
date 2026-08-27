import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { redisManager } from "./config/redis";

const app = createApp();

let server: ReturnType<typeof app.listen>;

async function bootstrap() {
  try {
    // 1. Connect to PostgreSQL via Prisma
    await connectDatabase();

    // 2. Connect to Redis (optional/resilient)
    await redisManager.connect();

    // 3. Start HTTP Server
    server = app.listen(env.PORT, "0.0.0.0", () => {
      const banner = [
        "",
        "============================================================",
        "  PRODUCTION AUTHENTICATION PLATFORM API",
        "============================================================",
        `  Environment   : ${env.NODE_ENV}`,
        `  Server Port   : ${env.PORT}`,
        `  Local URL     : http://localhost:${env.PORT}`,
        `  Health Check  : http://localhost:${env.PORT}/health`,
        `  Readiness     : http://localhost:${env.PORT}/ready`,
        `  Swagger UI    : http://localhost:${env.PORT}/docs`,
        `  OpenAPI JSON  : http://localhost:${env.PORT}/docs.json`,
        "============================================================",
        "",
      ].join("\n");

      console.log(banner);
      logger.info(`[SERVER] Auth service listening at http://localhost:${env.PORT}`);
      logger.info(`[DOCS] Documentation available at http://localhost:${env.PORT}/docs`);
    });
  } catch (error: any) {
    logger.fatal(`[SERVER] Fatal startup error: ${error.message}`);
    process.exit(1);
  }
}

// Graceful Shutdown Handler
const gracefulShutdown = (signal: string) => {
  logger.info(`\n[SHUTDOWN] Received ${signal}. Initiating graceful shutdown...`);

  if (server) {
    server.close(async () => {
      logger.info("[SHUTDOWN] HTTP server closed. Disconnecting downstream services...");
      try {
        await disconnectDatabase();
        await redisManager.disconnect();
        logger.info("[SHUTDOWN] Graceful shutdown complete. Exiting process.");
        process.exit(0);
      } catch (err: any) {
        logger.error(`[SHUTDOWN] Error during cleanup: ${err.message}`);
        process.exit(1);
      }
    });

    // Force exit if shutdown hangs after 10s
    setTimeout(() => {
      logger.error("[SHUTDOWN] Forceful shutdown after timeout.");
      process.exit(1);
    }, 10000).unref();
  } else {
    process.exit(0);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

bootstrap();

export { app, server };
