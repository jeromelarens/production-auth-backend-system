import { z } from "zod";
import { passwordSchema } from "../password/password.validation";

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please provide a valid email address"),
  password: passwordSchema,
  firstName: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must not exceed 50 characters")
    .regex(/^[A-Za-z\s'-]+$/, "First name must contain only letters"),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(50, "Last name must not exceed 50 characters")
    .regex(/^[A-Za-z\s'-]+$/, "Last name must contain only letters"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please provide a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

export const resendVerificationSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please provide a valid email address"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});
