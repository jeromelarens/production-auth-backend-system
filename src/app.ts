import express, { Express, Request, Response } from "express";
import pinoHttp from "pino-http";
import { applySecurityMiddleware } from "./middleware/security.middleware";
import { requestIdMiddleware } from "./middleware/request-id.middleware";
import { notFoundHandler, errorHandler } from "./middleware/error.middleware";
import { generalLimiter } from "./middleware/rate-limit.middleware";
import { logger } from "./config/logger";
import { prisma } from "./config/database";
import { redisManager } from "./config/redis";
import { setupSwagger } from "./docs/swagger";
import apiRoutes from "./routes";
import { ResponseFormatter } from "./utils/response";

export const createApp = (): Express => {
  const app = express();

  // 1. Request ID header
  app.use(requestIdMiddleware);

  // 2. HTTP Request Logger (Pino)
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => (req as any).requestId,
      autoLogging: {
        ignore: (req) => req.url === "/health" || req.url === "/ready",
      },
    })
  );

  // 3. Security Middlewares (Helmet, CORS, CookieParser, BodyLimit)
  applySecurityMiddleware(app);

  // 4. OpenAPI / Swagger Documentation
  setupSwagger(app);

  // 5. Health & Readiness Probes
  app.get("/health", (req: Request, res: Response) => {
    return ResponseFormatter.success(res, {
      status: "UP",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/ready", async (req: Request, res: Response) => {
    try {
      // Check PostgreSQL connectivity via Prisma
      await prisma.$queryRaw`SELECT 1`;
      const isDbHealthy = true;

      // Check Redis connectivity
      const isRedisHealthy = await redisManager.isHealthy();

      return ResponseFormatter.success(res, {
        status: "READY",
        services: {
          database: isDbHealthy ? "CONNECTED" : "DISCONNECTED",
          redis: isRedisHealthy ? "CONNECTED" : "STANDALONE_MODE",
        },
      });
    } catch (err: any) {
      return ResponseFormatter.error(res, `Readiness check failed: ${err.message}`, 503);
    }
  });

  // 6. Root status
  app.get("/", (req: Request, res: Response) => {
    return ResponseFormatter.success(res, {
      service: "Production Authentication Platform API",
      version: "v1.0.0",
      documentation: "/docs",
      endpoints: "/api/v1/auth",
    });
  });

  // 7. General API Rate Limiter
  app.use("/api", generalLimiter);

  // 8. Versioned API Routes
  app.use("/api/v1", apiRoutes);

  // 9. 404 and Global Error Handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
