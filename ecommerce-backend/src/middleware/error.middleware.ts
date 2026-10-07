import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { HttpError } from "../utils/httpError";

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  }
  if (err?.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e: any) => e.message);
    return res.status(400).json({ message: "Validation failed", errors: messages });
  }
  if (err?.name === "CastError") {
    return res.status(400).json({ message: `Invalid value for ${err.path}` });
  }
  if (err?.code === 11000) {
    return res.status(409).json({ message: "Duplicate value", fields: err.keyValue });
  }

  console.error(err);
  return res.status(500).json({ message: "Internal server error" });
};
