import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { ValidationError } from "../errors/ValidationError";

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = (err as any).issues || (err as any).errors || [];
        const details = issues.map((e: any) => ({
          field: Array.isArray(e.path) ? e.path.join(".") : "",
          message: e.message,
        }));
        const primaryMessage = details[0]?.message || "Validation failed";
        return next(new ValidationError(primaryMessage, details));
      }
      next(err);
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = (err as any).issues || (err as any).errors || [];
        const details = issues.map((e: any) => ({
          field: Array.isArray(e.path) ? e.path.join(".") : "",
          message: e.message,
        }));
        return next(new ValidationError("Invalid query parameters", details));
      }
      next(err);
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params) as any;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = (err as any).issues || (err as any).errors || [];
        const details = issues.map((e: any) => ({
          field: Array.isArray(e.path) ? e.path.join(".") : "",
          message: e.message,
        }));
        return next(new ValidationError("Invalid route parameters", details));
      }
      next(err);
    }
  };
};
