import { AppError } from "./AppError";
import { ErrorCode } from "./error-codes";

export class ValidationError extends AppError {
  constructor(message: string = "Validation failed", details?: any) {
    super(message, 400, ErrorCode.VALIDATION_ERROR, details, true);
  }
}
