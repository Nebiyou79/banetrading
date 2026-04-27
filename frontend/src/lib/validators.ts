// lib/validators.ts
// ── Zod schemas mirroring backend validation ──

import { z } from 'zod';

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Invalid email address')
  .transform((v) => v.toLowerCase());

export const strongPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[0-9]/, 'Password must include a number')
  .regex(/[^A-Za-z0-9]/, 'Password must include a special character');

export const otpSchema = z
  .string()
  .regex(/^\d{6}$/, 'Code must be 6 digits');

export const promoCodeSchema = z
  .string()
  .trim()
  .min(6, 'Promo code must be 6–12 characters')
  .max(12, 'Promo code must be 6–12 characters')
  .regex(/^[A-Za-z0-9]+$/, 'Promo code must be alphanumeric')
  .transform((v) => v.toUpperCase());

// ── Form schemas ──
export const registerFormSchema = z.object({
  name:      z.string().trim().min(1, 'Name is required').max(80, 'Name is too long'),
  email:     emailSchema,
  password:  strongPasswordSchema,
  country:   z.string().trim().min(2, 'Please select a country').max(80),
  promoCode: z
    .union([z.literal(''), promoCodeSchema])
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
});

export type RegisterFormValues = z.infer<typeof registerFormSchema>;

export const loginFormSchema = z.object({
  email:    emailSchema,
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
});
export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const verifyOtpFormSchema = z.object({
  otp: otpSchema,
});
export type VerifyOtpFormValues = z.infer<typeof verifyOtpFormSchema>;

export const forgotPasswordFormSchema = z.object({
  email: emailSchema,
});
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>;

export const resetPasswordFormSchema = z
  .object({
    newPassword:     strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });
export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;

// ── Profile schemas ──
export const personalInfoFormSchema = z.object({
  name:        z.string().trim().min(1, 'Name is required').max(80, 'Name is too long'),
  displayName: z.string().trim().min(2, 'Display name must be at least 2 characters').max(30, 'Display name must be at most 30 characters'),
  country:     z.string().trim().min(2, 'Please select a country').max(80),
  phone:       z.union([
    z.literal(''),
    z.string()
      .trim()
      .regex(/^\+?[0-9\s\-()]{7,20}$/, 'Invalid phone number')
      .max(20, 'Phone number is too long'),
  ]).transform((v) => (v === '' ? undefined : v)),
});
export type PersonalInfoFormValues = z.infer<typeof personalInfoFormSchema>;

export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword:     strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    path: ['newPassword'],
    message: 'New password must differ from your current password',
  });
export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;

// ── Password strength scoring (used by meter) ──
export interface PasswordChecks {
  length:  boolean;
  upper:   boolean;
  number:  boolean;
  special: boolean;
}
export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: 'empty' | 'weak' | 'fair' | 'good' | 'strong';
  checks: PasswordChecks;
}

export function scorePassword(pw: string): PasswordStrength {
  const checks: PasswordChecks = {
    length:  pw.length >= 8,
    upper:   /[A-Z]/.test(pw),
    number:  /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
  const passed = Number(checks.length) + Number(checks.upper) + Number(checks.number) + Number(checks.special);
  if (pw.length === 0) return { score: 0, label: 'empty', checks };
  if (passed <= 1) return { score: 1, label: 'weak', checks };
  if (passed === 2) return { score: 2, label: 'fair', checks };
  if (passed === 3) return { score: 3, label: 'good', checks };
  return { score: 4, label: 'strong', checks };
}