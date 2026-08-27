import { Request, Response } from "express";
import { PasswordManagementService } from "./password.service";
import { ResponseFormatter } from "../../utils/response";

export class PasswordController {
  static async forgotPassword(req: Request, res: Response): Promise<Response> {
    const { email } = req.body;
    await PasswordManagementService.requestPasswordReset(email, req.ip, req.headers["user-agent"]);

    // Always return success message to prevent user enumeration
    return ResponseFormatter.success(res, {
      message: "If an account with that email exists, password reset instructions have been sent.",
    });
  }

  static async resetPassword(req: Request, res: Response): Promise<Response> {
    const { token, newPassword } = req.body;
    await PasswordManagementService.resetPassword(token, newPassword, req.ip, req.headers["user-agent"]);

    return ResponseFormatter.success(res, {
      message: "Password has been successfully reset. Please log in with your new password.",
    });
  }

  static async changePassword(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;
    const currentSessionId = req.sessionId;

    await PasswordManagementService.changePassword(
      userId,
      currentPassword,
      newPassword,
      currentSessionId,
      req.ip,
      req.headers["user-agent"]
    );

    return ResponseFormatter.success(res, {
      message: "Password changed successfully. Other active sessions have been logged out.",
    });
  }
}
