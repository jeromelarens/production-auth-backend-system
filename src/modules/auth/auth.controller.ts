import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { AuthRepository } from "./auth.repository";
import { VerificationService } from "../verification/verification.service";
import { ResponseFormatter } from "../../utils/response";
import { AUTH_COOKIES, AUTH_MESSAGES } from "./auth.constants";
import { env } from "../../config/env";
import { AuthError } from "../../errors/AuthError";
import { ErrorCode } from "../../errors/error-codes";

export class AuthController {
  private static setRefreshTokenCookie(res: Response, refreshToken: string): void {
    res.cookie(AUTH_COOKIES.REFRESH_TOKEN, refreshToken, {
      httpOnly: true,
      secure: env.COOKIE_SECURE || env.NODE_ENV === "production",
      sameSite: "lax",
      domain: env.COOKIE_DOMAIN || undefined,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  private static clearRefreshTokenCookie(res: Response): void {
    res.clearCookie(AUTH_COOKIES.REFRESH_TOKEN, {
      httpOnly: true,
      secure: env.COOKIE_SECURE || env.NODE_ENV === "production",
      sameSite: "lax",
      domain: env.COOKIE_DOMAIN || undefined,
    });
  }

  static async register(req: Request, res: Response): Promise<Response> {
    const user = await AuthService.register(req.body, req.ip, req.headers["user-agent"] as string);
    return ResponseFormatter.success(
      res,
      {
        message: AUTH_MESSAGES.REGISTER_SUCCESS,
        user,
      },
      201
    );
  }

  static async login(req: Request, res: Response): Promise<Response> {
    const deviceName = (req.headers["x-device-name"] as string) || (req.headers["user-agent"] as string) || "Unknown Device";
    const result = await AuthService.login(req.body, req.ip, req.headers["user-agent"] as string, deviceName);

    AuthController.setRefreshTokenCookie(res, result.refreshToken);

    return ResponseFormatter.success(res, {
      message: AUTH_MESSAGES.LOGIN_SUCCESS,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  }

  static async refresh(req: Request, res: Response): Promise<Response> {
    const token = req.cookies?.[AUTH_COOKIES.REFRESH_TOKEN] || req.body?.refreshToken;

    if (!token) {
      throw new AuthError("Refresh token is required", ErrorCode.AUTH_TOKEN_INVALID, 400);
    }

    const result = await AuthService.refreshTokens(token, req.ip, req.headers["user-agent"] as string);

    AuthController.setRefreshTokenCookie(res, result.refreshToken);

    return ResponseFormatter.success(res, {
      message: AUTH_MESSAGES.REFRESH_SUCCESS,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  }

  static async logout(req: Request, res: Response): Promise<Response> {
    const token = req.cookies?.[AUTH_COOKIES.REFRESH_TOKEN] || req.body?.refreshToken;
    const jti = req.tokenJti;
    const userId = req.user?.id;

    await AuthService.logout(token, jti, userId, req.ip, req.headers["user-agent"] as string);
    AuthController.clearRefreshTokenCookie(res);

    return ResponseFormatter.success(res, {
      message: AUTH_MESSAGES.LOGOUT_SUCCESS,
    });
  }

  static async logoutAll(req: Request, res: Response): Promise<Response> {
    const userId = req.user!.id;
    await AuthService.logoutAll(userId, req.ip, req.headers["user-agent"] as string);
    AuthController.clearRefreshTokenCookie(res);

    return ResponseFormatter.success(res, {
      message: AUTH_MESSAGES.LOGOUT_ALL_SUCCESS,
    });
  }

  static async verifyEmail(req: Request, res: Response): Promise<Response> {
    const token = (req.query?.token as string) || req.body?.token;

    if (!token) {
      throw new AuthError("Verification token is required", ErrorCode.AUTH_TOKEN_INVALID, 400);
    }

    await VerificationService.verifyEmail(token, req.ip, req.headers["user-agent"] as string);

    return ResponseFormatter.success(res, {
      message: AUTH_MESSAGES.EMAIL_VERIFIED,
    });
  }

  static async resendVerification(req: Request, res: Response): Promise<Response> {
    const { email } = req.body;
    const user = await AuthRepository.findUserByEmail(email);

    if (user && !user.isEmailVerified) {
      await VerificationService.sendVerification(
        user.id,
        user.email,
        user.firstName,
        req.ip,
        req.headers["user-agent"] as string
      );
    }

    return ResponseFormatter.success(res, {
      message: AUTH_MESSAGES.VERIFICATION_RESENT,
    });
  }
}
