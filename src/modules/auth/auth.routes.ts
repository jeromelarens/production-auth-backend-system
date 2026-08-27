import { Router } from "express";
import { AuthController } from "./auth.controller";
import { validateBody, validateQuery } from "../../middleware/validation.middleware";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  refreshTokenSchema,
} from "./auth.validation";
import { authenticate } from "../../middleware/auth.middleware";
import {
  authLimiter,
  registrationLimiter,
  verificationLimiter,
} from "../../middleware/rate-limit.middleware";
import { asyncHandler } from "../../utils/async-handler";

const router = Router();

// Public Authentication Endpoints
router.post(
  "/register",
  registrationLimiter,
  validateBody(registerSchema),
  asyncHandler(AuthController.register)
);

router.post(
  "/login",
  authLimiter,
  validateBody(loginSchema),
  asyncHandler(AuthController.login)
);

router.post(
  "/refresh",
  authLimiter,
  validateBody(refreshTokenSchema),
  asyncHandler(AuthController.refresh)
);

router.post(
  "/verify-email",
  verificationLimiter,
  asyncHandler(AuthController.verifyEmail)
);

router.post(
  "/resend-verification",
  verificationLimiter,
  validateBody(resendVerificationSchema),
  asyncHandler(AuthController.resendVerification)
);

// Protected Authentication Endpoints
router.post("/logout", authenticate, asyncHandler(AuthController.logout));
router.post("/logout-all", authenticate, asyncHandler(AuthController.logoutAll));

export default router;
