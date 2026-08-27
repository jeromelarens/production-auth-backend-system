import { AuthRepository } from "./auth.repository";
import { RegisterDTO, LoginDTO, AuthTokensDTO, RefreshResultDTO } from "./auth.types";
import { PasswordService } from "../../services/password.service";
import { TokenService } from "../../services/token.service";
import { VerificationService } from "../verification/verification.service";
import { SessionRepository } from "../sessions/session.repository";
import { UserRepository } from "../users/user.repository";
import { AuditService } from "../audit/audit.service";
import { RedisService } from "../../services/redis.service";
import { AuditEventType } from "@prisma/client";
import { AuthError, ConflictError } from "../../errors/AuthError";
import { ErrorCode } from "../../errors/error-codes";
import { env } from "../../config/env";

export class AuthService {
  /**
   * Register a new user account and trigger email verification.
   */
  static async register(
    data: RegisterDTO,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ id: string; email: string; firstName: string; lastName: string }> {
    const existing = await AuthRepository.findUserByEmail(data.email);
    if (existing) {
      throw new ConflictError("An account with this email address already exists");
    }

    const passwordHash = await PasswordService.hash(data.password);

    const user = await AuthRepository.createUserWithDefaultRole({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
    });

    // Send email verification token
    await VerificationService.sendVerification(user.id, user.email, user.firstName, ipAddress, userAgent);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  /**
   * Authenticate user with password verification, lockout prevention, and session creation.
   */
  static async login(
    data: LoginDTO,
    ipAddress?: string,
    userAgent?: string,
    deviceName?: string
  ): Promise<AuthTokensDTO> {
    const user = await AuthRepository.findUserByEmail(data.email);

    if (!user) {
      // Dummy verify to equalize timing against timing attacks
      await PasswordService.verify("dummy_password", "$argon2id$v=19$m=65536,t=3,p=4$dummyhash");
      throw new AuthError("Invalid email or password", ErrorCode.AUTH_INVALID_CREDENTIALS);
    }

    if (!user.isActive) {
      throw new AuthError("Your account has been deactivated", ErrorCode.AUTH_ACCOUNT_INACTIVE);
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new AuthError(
        `Account is temporarily locked due to consecutive failed attempts. Please try again in ${remainingMinutes} minutes.`,
        ErrorCode.AUTH_ACCOUNT_LOCKED
      );
    }

    // Verify password
    const isMatch = await PasswordService.verify(data.password, user.passwordHash);

    if (!isMatch) {
      await UserRepository.incrementFailedAttempts(
        user.id,
        env.LOCKOUT_DURATION_MINUTES,
        env.MAX_LOGIN_ATTEMPTS
      );

      await AuditService.log({
        userId: user.id,
        event: AuditEventType.LOGIN_FAILED,
        ipAddress,
        userAgent,
      });

      throw new AuthError("Invalid email or password", ErrorCode.AUTH_INVALID_CREDENTIALS);
    }

    // Reset failed login counter upon successful authentication
    await UserRepository.resetFailedAttemptsAndSetLogin(user.id);

    const roles = user.roles.map((r) => r.role.name.toString());
    const accessToken = TokenService.generateAccessToken(user.id, roles);
    const { rawToken: refreshToken, tokenHash, expiresAt } = TokenService.generateRefreshToken();

    // Create session in database
    await SessionRepository.create({
      userId: user.id,
      refreshTokenHash: tokenHash,
      deviceName: deviceName || null,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
      expiresAt,
    });

    await AuditService.log({
      userId: user.id,
      event: AuditEventType.LOGIN_SUCCESS,
      ipAddress,
      userAgent,
      metadata: { deviceName },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified,
        roles,
      },
    };
  }

  /**
   * Rotate refresh token and detect token reuse attacks.
   */
  static async refreshTokens(
    rawRefreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<RefreshResultDTO> {
    const tokenHash = TokenService.hashRefreshToken(rawRefreshToken);
    const session = await SessionRepository.findByRefreshTokenHash(tokenHash);

    if (!session) {
      throw new AuthError("Invalid or expired refresh token", ErrorCode.AUTH_TOKEN_INVALID);
    }

    // REUSE DETECTION: If token was already revoked, an attacker or compromised client reused it!
    if (session.revokedAt !== null) {
      // Invalidate the entire session family for security
      await SessionRepository.revokeAllForUser(session.userId);

      await AuditService.log({
        userId: session.userId,
        event: AuditEventType.REFRESH_REUSE_DETECTED,
        ipAddress,
        userAgent,
        metadata: { compromisedSessionId: session.id },
      });

      throw new AuthError(
        "Security alert: Refresh token reuse detected. All sessions have been revoked for your protection.",
        ErrorCode.AUTH_TOKEN_REUSE_DETECTED,
        401
      );
    }

    // Check expiration
    if (session.expiresAt < new Date()) {
      await SessionRepository.revoke(session.id);
      throw new AuthError("Refresh token has expired. Please log in again.", ErrorCode.AUTH_TOKEN_EXPIRED);
    }

    if (!session.user.isActive) {
      await SessionRepository.revoke(session.id);
      throw new AuthError("Account is inactive", ErrorCode.AUTH_ACCOUNT_INACTIVE);
    }

    // Generate new token pair
    const roles = session.user.roles.map((r) => r.role.name.toString());
    const newAccessToken = TokenService.generateAccessToken(session.userId, roles);
    const { rawToken: newRefreshToken, tokenHash: newHash, expiresAt: newExpiresAt } =
      TokenService.generateRefreshToken();

    // Rotate session: atomically revoke old session and create new child session
    await SessionRepository.rotateSession(session.id, {
      userId: session.userId,
      refreshTokenHash: newHash,
      deviceName: session.deviceName,
      userAgent: userAgent || session.userAgent,
      ipAddress: ipAddress || session.ipAddress,
      expiresAt: newExpiresAt,
    });

    await AuditService.log({
      userId: session.userId,
      event: AuditEventType.REFRESH_SUCCESS,
      ipAddress,
      userAgent,
      metadata: { previousSessionId: session.id },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Log out current session.
   */
  static async logout(
    rawRefreshToken?: string,
    jti?: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    if (rawRefreshToken) {
      const tokenHash = TokenService.hashRefreshToken(rawRefreshToken);
      const session = await SessionRepository.findByRefreshTokenHash(tokenHash);
      if (session && !session.revokedAt) {
        await SessionRepository.revoke(session.id);
      }
    }

    if (jti) {
      await RedisService.blacklistToken(jti);
    }

    if (userId) {
      await AuditService.log({
        userId,
        event: AuditEventType.LOGOUT,
        ipAddress,
        userAgent,
      });
    }
  }

  /**
   * Log out all active sessions for user.
   */
  static async logoutAll(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await SessionRepository.revokeAllForUser(userId);

    await AuditService.log({
      userId,
      event: AuditEventType.LOGOUT_ALL,
      ipAddress,
      userAgent,
    });
  }
}
