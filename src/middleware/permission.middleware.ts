import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database";
import { ForbiddenError, AuthError } from "../errors/AuthError";
import { ErrorCode } from "../errors/error-codes";

export const requirePermissions = (...requiredPermissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(new AuthError("Authentication required", ErrorCode.AUTH_UNAUTHORIZED));
      }

      // Check if user has roles that map to required permissions
      const userWithPermissions = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!userWithPermissions) {
        return next(new ForbiddenError("User permissions cannot be verified", ErrorCode.AUTH_FORBIDDEN));
      }

      const userPermissions = new Set<string>();
      for (const userRole of userWithPermissions.roles) {
        for (const rolePerm of userRole.role.permissions) {
          userPermissions.add(rolePerm.permission.action);
        }
      }

      const hasAll = requiredPermissions.every((p) => userPermissions.has(p));
      if (!hasAll) {
        return next(
          new ForbiddenError(
            `Missing required permissions: ${requiredPermissions.join(", ")}`,
            ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS
          )
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
