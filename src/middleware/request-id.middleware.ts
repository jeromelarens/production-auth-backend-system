import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const existingId = req.headers["x-request-id"] as string;
  const requestId = existingId || crypto.randomUUID();

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  next();
};
