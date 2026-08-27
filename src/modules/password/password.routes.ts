import { Router } from "express";
import { PasswordController } from "./password.controller";
import { validateBody } from "../../middleware/validation.middleware";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "./password.validation";
import { authenticate } from "../../middleware/auth.middleware";
import { passwordResetLimiter } from "../../middleware/rate-limit.middleware";
import { asyncHandler } from "../../utils/async-handler";

const router = Router();

router.post(
  "/forgot-password",
  passwordResetLimiter,
  validateBody(forgotPasswordSchema),
  asyncHandler(PasswordController.forgotPassword)
);

router.post(
  "/reset-password",
  passwordResetLimiter,
  validateBody(resetPasswordSchema),
  asyncHandler(PasswordController.resetPassword)
);

router.post(
  "/change-password",
  authenticate,
  validateBody(changePasswordSchema),
  asyncHandler(PasswordController.changePassword)
);

export default router;
