import { Router } from "express";
import { UserController } from "./user.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";

const router = Router();

// /api/v1/auth/me
router.get("/me", authenticate, asyncHandler(UserController.getMe));

export default router;
