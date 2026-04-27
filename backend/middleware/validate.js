// middleware/validate.js
// ── Zod-based request validation ──

const { z } = require('zod');

// ── Shared primitives ──
const emailSchema = z.string().trim().toLowerCase().email('Invalid email address');

const strongPassword = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[0-9]/, 'Password must include a number')
  .regex(/[^A-Za-z0-9]/, 'Password must include a special character');

const otpCode = z.string().regex(/^\d{6}$/, 'Code must be 6 digits');

const promoCodeField = z.string()
  .trim()
  .toUpperCase()
  .min(6, 'Promo code must be 6–12 characters')
  .max(12, 'Promo code must be 6–12 characters')
  .regex(/^[A-Z0-9]+$/, 'Promo code must be alphanumeric');

// ── Auth schemas ──
const registerSchema = z.object({
  name:      z.string().trim().min(1, 'Name is required').max(80),
  email:     emailSchema,
  password:  strongPassword,
  country:   z.string().trim().min(2).max(80).optional(),
  promoCode: promoCodeField.optional(),
});

const loginSchema = z.object({
  email:    emailSchema,
  password: z.string().min(1, 'Password is required'),
});

const verifyOtpSchema = z.object({
  email:   emailSchema,
  otp:     otpCode,
  purpose: z.enum(['email_verification', 'password_reset']),
});

const resendOtpSchema = z.object({
  email:   emailSchema,
  purpose: z.enum(['email_verification', 'password_reset']),
});

const forgotPasswordSchema = z.object({
  email: emailSchema,
});

const verifyResetOtpSchema = z.object({
  email: emailSchema,
  otp:   otpCode,
});

const resetPasswordWithTokenSchema = z.object({
  token:       z.string().min(10, 'Invalid reset token'),
  newPassword: strongPassword,
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10, 'Missing refresh token'),
});

// ── Middleware factory ──
function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        const first = parsed.error.errors[0];
        return res.status(400).json({
          message: first?.message || 'Invalid request body',
          errors: parsed.error.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
        });
      }
      req.body = parsed.data;
      return next();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }
  };
}

// ── Profile schemas ──
const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s\-()]{7,20}$/, 'Invalid phone number')
  .max(20, 'Phone number is too long');

const displayNameSchema = z
  .string()
  .trim()
  .min(2, 'Display name must be at least 2 characters')
  .max(30, 'Display name must be at most 30 characters');

const updateProfileSchema = z.object({
  name:        z.string().trim().min(1, 'Name is required').max(80).optional(),
  displayName: displayNameSchema.optional(),
  country:     z.string().trim().min(2).max(80).optional(),
  phone:       z.union([z.literal(''), phoneSchema]).optional().transform((v) => (v === '' ? undefined : v)),
}).refine((d) => Object.values(d).some((v) => v !== undefined), {
  message: 'No fields to update',
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword:     strongPassword,
}).refine((d) => d.currentPassword !== d.newPassword, {
  path: ['newPassword'],
  message: 'New password must differ from your current password',
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  verifyResetOtpSchema,
  resetPasswordWithTokenSchema,
  refreshSchema,
  updateProfileSchema,
  changePasswordSchema,
};