import { Router } from "express";
import { SessionController } from "./session.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";

const router = Router();

// All session routes require authentication
router.use(authenticate);

router.get("/", asyncHandler(SessionController.getSessions));
router.delete("/:sessionId", asyncHandler(SessionController.revokeSession));

export default router;
