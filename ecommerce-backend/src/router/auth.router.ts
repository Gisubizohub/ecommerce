import { Router } from "express";
import { login, register, profile, forgotPassword, resetPassword } from "../controller/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, example: "Jane Doe" }
 *               email: { type: string, example: "jane@example.com" }
 *               password: { type: string, example: "secret123" }
 *     responses:
 *       201: { description: User registered }
 *       400: { description: Validation error or user already exists }
 */
router.post("/register", register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Log in and receive a JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: "jane@example.com" }
 *               password: { type: string, example: "secret123" }
 *     responses:
 *       200: { description: Login successful, returns token }
 *       401: { description: Invalid email or password }
 */
router.post("/login", login);
router.get("/profile", authenticate, profile);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
export default router;
