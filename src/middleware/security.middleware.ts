import express, { Express } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "../config/env";

export const applySecurityMiddleware = (app: Express): void => {
  // 1. Helmet security headers
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === "production" ? undefined : false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // 2. CORS whitelist
  const allowedOrigins = env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
          return callback(null, true);
        }
        return callback(new Error("CORS policy violation"));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-request-id", "x-device-name"],
    })
  );

  // 3. Cookie parser
  app.use(cookieParser(env.COOKIE_SECRET));

  // 4. Request body size limits
  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: true, limit: "100kb" }));
};
