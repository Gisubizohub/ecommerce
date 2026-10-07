import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { HttpError } from "../utils/httpError";

export type Role = "user" | "admin";

export interface AuthPayload {
  userId: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export const authenticate = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next(new HttpError(401, "Authentication token is required (Authorization: Bearer <token>)"));
  }

  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as AuthPayload;
    const normalizedRole = String(decoded.role ?? "").trim() as Role;

    if (normalizedRole !== "user" && normalizedRole !== "admin") {
      return next(new HttpError(401, "Invalid user role in token"));
    }

    req.user = { userId: decoded.userId, role: normalizedRole };
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired token"));
  }
};

export const authorize =
  (...roles: Role[]) =>
  (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new HttpError(403, "You do not have permission to perform this action"));
    }
    next();
  };
