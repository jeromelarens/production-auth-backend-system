import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { AppError } from "../errors/AppError";
import { ErrorCode } from "../errors/error-codes";
import { ResponseFormatter } from "../utils/response";
import { logger } from "../config/logger";
import { env } from "../config/env";

export const notFoundHandler = (req: Request, res: Response): Response => {
  return ResponseFormatter.error(
    res,
    `Route ${req.method} ${req.originalUrl} not found`,
    404,
    ErrorCode.RESOURCE_NOT_FOUND,
    undefined,
    req.requestId
  );
};

export const errorHandler: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Handle AppError and custom operational exceptions
  if (err instanceof AppError) {
    ResponseFormatter.error(
      res,
      err.message,
      err.statusCode,
      err.code,
      err.details,
      req.requestId
    );
    return;
  }

  // Handle JSON parse errors
  if (err instanceof SyntaxError && (err as any).status === 400 && "body" in err) {
    ResponseFormatter.error(
      res,
      "Invalid JSON payload format",
      400,
      ErrorCode.VALIDATION_ERROR,
      undefined,
      req.requestId
    );
    return;
  }

  // Log unhandled unexpected errors
  logger.error({
    err,
    requestId: req.requestId,
    url: req.originalUrl,
    method: req.method,
    message: err.message || "Unhandled server exception",
  });

  // Never expose internal stack traces or database errors in production
  const message =
    env.NODE_ENV === "production"
      ? "An internal server error occurred"
      : err.message || "Internal server error";

  ResponseFormatter.error(
    res,
    message,
    500,
    ErrorCode.INTERNAL_SERVER_ERROR,
    env.NODE_ENV !== "production" ? err.stack : undefined,
    req.requestId
  );
};
