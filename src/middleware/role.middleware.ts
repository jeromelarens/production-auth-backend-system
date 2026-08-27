import { Request, Response, NextFunction } from "express";
import { ForbiddenError, AuthError } from "../errors/AuthError";
import { ErrorCode } from "../errors/error-codes";

export const requireRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthError("Authentication required", ErrorCode.AUTH_UNAUTHORIZED));
    }

    const hasRole = req.user.roles.some((r) => roles.includes(r));
    if (!hasRole) {
      return next(
        new ForbiddenError(
          `Insufficient permissions. Requires one of: ${roles.join(", ")}`,
          ErrorCode.AUTH_FORBIDDEN
        )
      );
    }

    next();
  };
};
