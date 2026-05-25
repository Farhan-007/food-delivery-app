import { z } from 'zod';

// ============================================================
// Auth Validators
// ============================================================

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number')
    .optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
}).refine((data) => data.email ?? data.phone, {
  message: 'Either email or phone is required',
  path: ['email'],
});

export const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(1, 'Password is required'),
}).refine((data) => data.email ?? data.phone, {
  message: 'Either email or phone is required',
});

export const otpRequestSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number'),
});

export const otpVerifySchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number'),
  code: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must contain only digits'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128)
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OtpRequestInput = z.infer<typeof otpRequestSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
