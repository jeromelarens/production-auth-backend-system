import { Response } from "express";
import { ApiResponse } from "../types/common";
import { ErrorCode } from "../errors/error-codes";

export class ResponseFormatter {
  static success<T>(
    res: Response,
    data?: T,
    statusCode: number = 200,
    requestId?: string
  ): Response {
    const payload: ApiResponse<T> = {
      success: true,
      data,
      requestId: requestId || (res.req as any)?.requestId,
    };
    return res.status(statusCode).json(payload);
  }

  static error(
    res: Response,
    message: string,
    statusCode: number = 500,
    code: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR,
    details?: any,
    requestId?: string
  ): Response {
    const payload: ApiResponse = {
      success: false,
      error: {
        code,
        message,
        details,
      },
      requestId: requestId || (res.req as any)?.requestId,
    };
    return res.status(statusCode).json(payload);
  }
}
