import { NextFunction, RequestHandler, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";

// Lets controllers `throw` errors instead of repeating try/catch everywhere.
export const asyncHandler =
  (fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req as AuthRequest, res, next)).catch(next);
  };
