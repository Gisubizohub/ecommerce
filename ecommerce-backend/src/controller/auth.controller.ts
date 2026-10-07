import { Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User } from "../model/user.model";
import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../utils/httpError";
import { signToken } from "../utils/jwt";
import { sendResetCodeEmail, sendWelcomeEmail }  from "../service/email.service";

const hashCode = (code: string) => crypto.createHash("sha256").update(code).digest("hex");

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new HttpError(400, "Name, email and password are required");
  }
  if (typeof password !== "string" || password.length < 6) {
    throw new HttpError(400, "Password must be at least 6 characters");
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  if (await User.findOne({ email: normalizedEmail })) {
    throw new HttpError(400, "User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  // role is never taken from the request body; new users are always "user"
  const user = await User.create({ name, email: normalizedEmail, password: hashedPassword });

  try {
    await sendWelcomeEmail(user.email, user.name);
  } catch (error) {
    console.error("Failed to send welcome email:", error);
  }

  res.status(201).json({
    message: "User registered successfully",
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new HttpError(400, "Email and password are required");
  }

  const user = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new HttpError(401, "Invalid email or password");
  }

  const normalizedRole = String(user.role ?? "").trim() as "user" | "admin";
  const token = jwt.sign({ userId: user._id, role: normalizedRole }, process.env.JWT_SECRET as string, {
    expiresIn: "1d",
  });

  res.status(200).json({
    message: "Login successful",
    token,
    user: { id: user._id, name: user.name, email: user.email, role: normalizedRole },
  });
});
export const profile = async (req: Request, res: Response) => {
  res.json({ user: req.body });
};
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

// Same response whether the email exists or not, so attackers can't discover accounts
  const message = "If that email is registered, a reset code has been sent";

  const user = await User.findOne({ email });
  if (!user) {
    return res.json({ message });
  }

  const code = crypto.randomInt(100000, 1000000).toString();
  user.resetCode = hashCode(code);
  user.resetCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();
  try {
   await sendResetCodeEmail(email, code);
  } catch (error) {
    console.error("Failed to send reset email:", error);
    user.resetCode = undefined;
    user.resetCodeExpires = undefined;
    await user.save();
    return res.status(500).json({ message: "Could not send reset email, try again later" });
  }
  res.json({ message });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ message: "Email, code and newPassword are required" });
  }

  const user = await User.findOne({
    email,
    resetCode: hashCode(String(code)),
    resetCodeExpires: { $gt: new Date() },
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired code" });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetCode = undefined;
  user.resetCodeExpires = undefined;
  await user.save();

  res.json({ message: "Password reset successful, you can now log in" });
};