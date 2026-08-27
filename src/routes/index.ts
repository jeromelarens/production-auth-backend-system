import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import userRoutes from "../modules/users/user.routes";
import sessionRoutes from "../modules/sessions/session.routes";
import passwordRoutes from "../modules/password/password.routes";

const router = Router();

// Combine all auth sub-modules under clean /api/v1/auth path
router.use("/auth", authRoutes);
router.use("/auth", userRoutes);
router.use("/auth/sessions", sessionRoutes);
router.use("/auth", passwordRoutes);

export default router;
