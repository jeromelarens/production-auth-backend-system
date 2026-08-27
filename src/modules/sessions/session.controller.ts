import { Request, Response } from "express";
import { SessionService } from "./session.service";
import { ResponseFormatter } from "../../utils/response";

export class SessionController {
  static async getSessions(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const currentSessionId = req.sessionId;

    const sessions = await SessionService.getUserSessions(userId, currentSessionId);
    return ResponseFormatter.success(res, { sessions });
  }

  static async revokeSession(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { sessionId } = req.params;

    await SessionService.revokeSession(
      userId,
      sessionId as string,
      req.ip,
      req.headers["user-agent"] as string
    );
    return ResponseFormatter.success(res, { message: "Session revoked successfully" });
  }
}
