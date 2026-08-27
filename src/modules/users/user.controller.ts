import { Request, Response } from "express";
import { UserService } from "./user.service";
import { ResponseFormatter } from "../../utils/response";

export class UserController {
  static async getMe(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const profile = await UserService.getCurrentUserProfile(userId);
    return ResponseFormatter.success(res, { user: profile });
  }
}
