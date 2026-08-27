import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { generateRandomToken, hashToken } from "../utils/crypto";
import { AuthError } from "../errors/AuthError";
import { ErrorCode } from "../errors/error-codes";

export interface AccessTokenPayload {
  sub: string;
  type: "access";
  jti: string;
  roles?: string[];
}

export interface RefreshTokenResult {
  rawToken: string;
  tokenHash: string;
  expiresAt: Date;
}

export class TokenService {
  /**
   * Generate a short-lived access JWT.
   */
  static generateAccessToken(userId: string, roles: string[] = []): string {
    const jti = generateRandomToken(16);
    const payload: AccessTokenPayload = {
      sub: userId,
      type: "access",
      jti,
      roles,
    };

    const options: SignOptions = {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
    };

    return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
  }

  /**
   * Verify an access JWT.
   */
  static verifyAccessToken(token: string): AccessTokenPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload & AccessTokenPayload;
      if (decoded.type !== "access") {
        throw new AuthError("Invalid token type", ErrorCode.AUTH_TOKEN_INVALID);
      }
      return decoded;
    } catch (err: any) {
      if (err instanceof AuthError) throw err;
      if (err.name === "TokenExpiredError") {
        throw new AuthError("Access token has expired", ErrorCode.AUTH_TOKEN_EXPIRED);
      }
      throw new AuthError("Invalid or corrupted access token", ErrorCode.AUTH_TOKEN_INVALID);
    }
  }

  /**
   * Generate an opaque cryptographic refresh token and its SHA-256 hash.
   */
  static generateRefreshToken(): RefreshTokenResult {
    const rawToken = generateRandomToken(48); // 96 hex characters
    const tokenHash = hashToken(rawToken);

    // Calculate expiration date (default 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return {
      rawToken,
      tokenHash,
      expiresAt,
    };
  }

  /**
   * Hash a raw refresh token to match against the database.
   */
  static hashRefreshToken(rawToken: string): string {
    return hashToken(rawToken);
  }
}
