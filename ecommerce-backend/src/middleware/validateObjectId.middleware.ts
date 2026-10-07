import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { HttpError } from "../utils/httpError";

export const validateObjectId = (req: Request, _res: Response, next: NextFunction) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new HttpError(400, "Invalid id format"));
  }
  next();
};
