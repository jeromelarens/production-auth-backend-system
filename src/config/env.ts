import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  
  // Redis
  REDIS_URL: z.string().default("redis://localhost:6379"),
  REDIS_ENABLED: z.preprocess((val) => val === "true" || val === true, z.boolean()).default(false),

  // JWT configuration
  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 chars").default("default_access_secret_super_secure_2026_dev"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 chars").default("default_refresh_secret_super_secure_2026_dev"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  // Cookie configuration
  COOKIE_SECRET: z.string().default("cookie_secret_key_super_secure"),
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECURE: z.preprocess((val) => val === "true" || val === true, z.boolean()).default(false),

  // CORS
  ALLOWED_ORIGINS: z.string().default("http://localhost:3000,http://localhost:5173"),

  // Account Security
  MAX_LOGIN_ATTEMPTS: z.coerce.number().default(5),
  LOCKOUT_DURATION_MINUTES: z.coerce.number().default(15),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000), // 15 mins
  RATE_LIMIT_MAX: z.coerce.number().default(100), // 100 general reqs
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(15), // 15 auth reqs per 15 mins

  // Email Service
  EMAIL_PROVIDER: z.enum(["console", "mock", "smtp", "sendgrid"]).default("console"),
  EMAIL_FROM: z.string().email().default("noreply@authservice.local"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables detected at startup:");
  console.error(parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
