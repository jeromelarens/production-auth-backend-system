import { Request, Response, NextFunction } from "express";
import { TokenService } from "../services/token.service";
import { RedisService } from "../services/redis.service";
import { prisma } from "../config/database";
import { AuthError } from "../errors/AuthError";
import { ErrorCode } from "../errors/error-codes";

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AuthError("Authentication required. Missing Authorization header.", ErrorCode.AUTH_UNAUTHORIZED);
    }

    if (!authHeader.startsWith("Bearer ")) {
      throw new AuthError("Invalid token format. Bearer prefix required.", ErrorCode.AUTH_TOKEN_INVALID);
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new AuthError("Authentication token cannot be empty.", ErrorCode.AUTH_TOKEN_INVALID);
    }

    // 1. Cryptographically verify JWT access token
    const decoded = TokenService.verifyAccessToken(token);

    // 2. Check if token JTI is blacklisted (e.g. from logout)
    if (decoded.jti) {
      const isBlacklisted = await RedisService.isTokenBlacklisted(decoded.jti);
      if (isBlacklisted) {
        throw new AuthError("Token has been revoked. Please log in again.", ErrorCode.AUTH_TOKEN_REVOKED);
      }
    }

    // 3. Verify user exists and is active in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new AuthError("User account is inactive or no longer exists.", ErrorCode.AUTH_ACCOUNT_INACTIVE);
    }

    const roles = user.roles.map((r) => r.role.name.toString());

    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
    };
    req.tokenJti = decoded.jti;

    next();
  } catch (error) {
    next(error);
  }
};
