import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
  resetCode?: string;
  resetCodeExpires?: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      trim: true,
      set: (value: string) => (typeof value === "string" ? value.trim() : value),
    },
    resetCode: { type: String, select: false },
    resetCodeExpires: { type:Date, select: false},
    
  },
  { timestamps: true },
);

export const User = mongoose.model<IUser>("User", userSchema);
