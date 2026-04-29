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

// ── Funds: Deposit / Withdraw ──
const COINS = ['USDT', 'BTC', 'ETH'];
const DEPOSIT_NETWORKS  = ['ERC20', 'TRC20', 'BEP20', 'Bitcoin', 'Ethereum'];
const WITHDRAW_NETWORKS = ['USDT-ERC20', 'USDT-TRC20', 'USDT-BEP20', 'BTC', 'ETH'];

const DEPOSIT_NETWORKS_FOR_COIN = {
  USDT: ['ERC20', 'TRC20', 'BEP20'],
  BTC:  ['Bitcoin'],
  ETH:  ['Ethereum'],
};
const WITHDRAW_NETWORKS_FOR_COIN = {
  USDT: ['USDT-ERC20', 'USDT-TRC20', 'USDT-BEP20'],
  BTC:  ['BTC'],
  ETH:  ['ETH'],
};

const depositSchema = z.object({
  amount:   z.coerce.number({ invalid_type_error: 'Amount must be a number' }).positive('Amount must be greater than 0'),
  currency: z.enum(COINS, { errorMap: () => ({ message: 'Invalid coin' }) }),
  network:  z.enum(DEPOSIT_NETWORKS, { errorMap: () => ({ message: 'Invalid network' }) }),
  note:     z.string().trim().max(500, 'Note must be at most 500 characters').optional(),
}).refine(
  (d) => DEPOSIT_NETWORKS_FOR_COIN[d.currency].includes(d.network),
  { path: ['network'], message: 'Selected network is not valid for this coin' },
);

const withdrawSchema = z.object({
  amount:    z.coerce.number({ invalid_type_error: 'Amount must be a number' }).positive('Amount must be greater than 0'),
  currency:  z.enum(COINS, { errorMap: () => ({ message: 'Invalid coin' }) }),
  network:   z.enum(WITHDRAW_NETWORKS, { errorMap: () => ({ message: 'Invalid network' }) }),
  toAddress: z.string().trim().min(8, 'Destination address is too short').max(120, 'Destination address is too long'),
  note:      z.string().trim().max(500).optional(),
}).refine(
  (d) => WITHDRAW_NETWORKS_FOR_COIN[d.currency].includes(d.network),
  { path: ['network'], message: 'Selected network is not valid for this coin' },
);

// ── Admin: deposit addresses + network fees ──
const addressEntry = z.union([z.string().trim().min(8, 'Address is too short').max(120, 'Address is too long'), z.literal('')]);
const updateAddressesSchema = z.object({
  'USDT-ERC20': addressEntry.optional(),
  'USDT-TRC20': addressEntry.optional(),
  'USDT-BEP20': addressEntry.optional(),
  BTC:          addressEntry.optional(),
  ETH:          addressEntry.optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'No addresses provided' });

const updateFeeSchema = z.object({
  fee: z.coerce.number({ invalid_type_error: 'Fee must be a number' }).min(0, 'Fee cannot be negative'),
});

// ── KYC: Level 2 + Level 3 ──
const isoDate = z.preprocess((v) => {
  if (typeof v === 'string' && v) {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  if (v instanceof Date) return v;
  return undefined;
}, z.date({ invalid_type_error: 'Invalid date' }));

const ageAtLeast18 = (d) => {
  const now = new Date();
  const eighteen = new Date(d.getFullYear() + 18, d.getMonth(), d.getDate());
  return eighteen.getTime() <= now.getTime();
};

const kycLevel2Schema = z.object({
  fullName:    z.string().trim().min(2, 'Full name is required').max(120),
  dateOfBirth: isoDate.refine((d) => d.getTime() < Date.now(), { message: 'Date of birth must be in the past' })
                       .refine((d) => ageAtLeast18(d), { message: 'You must be at least 18 years old' }),
  country:     z.string().trim().min(2, 'Country is required').max(80),
  idType:      z.enum(['passport', 'national_id', 'drivers_license'], { errorMap: () => ({ message: 'Invalid ID type' }) }),
  idNumber:    z.string().trim().min(2, 'ID number is required').max(60),
  expiryDate:  z.union([z.literal(''), isoDate]).optional()
                .transform((v) => (v === '' || v === undefined ? undefined : v)),
});

const kycLevel3Schema = z.object({
  fullName:    z.string().trim().min(2, 'Full name is required').max(120),
  addressLine: z.string().trim().min(4, 'Address is required').max(200),
  city:        z.string().trim().min(2, 'City is required').max(80),
  postalCode:  z.string().trim().min(2, 'Postal code is required').max(20),
  country:     z.string().trim().min(2, 'Country is required').max(80),
});

const kycRejectSchema = z.object({
  reason: z.string().trim().min(2, 'Reason is required').max(500, 'Reason is too long'),
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
  depositSchema,
  withdrawSchema,
  updateAddressesSchema,
  updateFeeSchema,
  kycLevel2Schema,
  kycLevel3Schema,
  kycRejectSchema,
};