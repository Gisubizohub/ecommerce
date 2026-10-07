import multer from "multer";
import { HttpError } from "../utils/httpError";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new HttpError(400, "Only image files are allowed"));
    }
    cb(null, true);
  },
});
