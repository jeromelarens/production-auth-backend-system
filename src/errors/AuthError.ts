import { AppError } from "./AppError";
import { ErrorCode } from "./error-codes";

export class AuthError extends AppError {
  constructor(
    message: string = "Authentication failed",
    code: ErrorCode = ErrorCode.AUTH_UNAUTHORIZED,
    statusCode: number = 401,
    details?: any
  ) {
    super(message, statusCode, code, details, true);
  }
}

export class ForbiddenError extends AppError {
  constructor(
    message: string = "Access forbidden",
    code: ErrorCode = ErrorCode.AUTH_FORBIDDEN,
    details?: any
  ) {
    super(message, 403, code, details, true);
  }
}

export class NotFoundError extends AppError {
  constructor(
    message: string = "Resource not found",
    code: ErrorCode = ErrorCode.RESOURCE_NOT_FOUND,
    details?: any
  ) {
    super(message, 404, code, details, true);
  }
}

export class ConflictError extends AppError {
  constructor(
    message: string = "Resource already exists",
    code: ErrorCode = ErrorCode.CONFLICT_ERROR,
    details?: any
  ) {
    super(message, 409, code, details, true);
  }
}
