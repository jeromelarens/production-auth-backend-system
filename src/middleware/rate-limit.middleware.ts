import rateLimit from "express-rate-limit";
import { env } from "../config/env";
import { ErrorCode } from "../errors/error-codes";

const createLimiter = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: ErrorCode.RATE_LIMIT_EXCEEDED,
          message,
        },
        requestId: req.requestId,
      });
    },
  });
};

// General API Rate Limiter
export const generalLimiter = createLimiter(
  env.RATE_LIMIT_WINDOW_MS,
  env.RATE_LIMIT_MAX,
  "Too many requests from this IP, please try again later."
);

// Strict Authentication Limiter (Login, Refresh)
export const authLimiter = createLimiter(
  15 * 60 * 1000, // 15 mins
  env.AUTH_RATE_LIMIT_MAX, // 15 attempts
  "Too many authentication attempts. Please try again in 15 minutes."
);

// Registration Limiter
export const registrationLimiter = createLimiter(
  60 * 60 * 1000, // 1 hour
  10, // 10 registrations per hour per IP
  "Too many accounts created from this IP. Please try again later."
);

// Password Reset Limiter
export const passwordResetLimiter = createLimiter(
  15 * 60 * 1000, // 15 mins
  5, // 5 attempts
  "Too many password reset attempts. Please try again in 15 minutes."
);

// Verification Limiter
export const verificationLimiter = createLimiter(
  15 * 60 * 1000, // 15 mins
  5, // 5 attempts
  "Too many verification requests. Please try again later."
);
