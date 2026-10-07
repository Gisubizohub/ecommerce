import { Router } from "express";
import { getAllUsers } from "../controller/user.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/authorize";

const router = Router();

// Admin only: must be logged in (authenticate) AND have the admin role (authorize)
router.get("/", authenticate, authorize("admin"), getAllUsers);

export default router;