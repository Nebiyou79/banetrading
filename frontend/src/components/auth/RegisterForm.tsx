// components/auth/RegisterForm.tsx
// ── BaneTrading — Registration form ──
// Name + email + password (with strength meter) + country + promo code
// Zero hardcoded hex. Full CSS-var theming. Both themes polished.

import { useEffect, useRef, useState, forwardRef } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Mail,
  Tag,
  User as UserIcon,
  X,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
  country: string;
  promoCode?: string;
}

type PromoState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'valid'; code: string }
  | { status: 'invalid'; reason: 'format' | 'not_found' | 'inactive' };

interface RegisterFormProps {
  onSubmit: (values: RegisterFormValues) => Promise<void>;
  serverError?: string | null;
  isSubmitting?: boolean;
  /** Country options */
  countries: Array<{ value: string; label: string }>;
  /** Async promo validator — resolves to { valid: boolean; code?: string; reason?: string } */
  validatePromo?: (
    code: string,
  ) => Promise<{ valid: boolean; code?: string; reason?: string }>;
}

// ─── FormField ────────────────────────────────────────────────────────────────

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  helper?: React.ReactNode;
  children: React.ReactNode;
}

export function FormField({
  label,
  htmlFor,
  error,
  helper,
  children,
}: FormFieldProps): JSX.Element {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: 'var(--text-secondary)' }}
      >
        {label}
      </label>
      {children}
      {error && (
        <p
          className="flex items-center gap-1 text-xs"
          style={{ color: 'var(--danger)' }}
          role="alert"
        >
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          {error}
        </p>
      )}
      {!error && helper && (
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {helper}
        </div>
      )}
    </div>
  );
}

// ─── Input primitive (shared) ─────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  error?: string;
  showPasswordToggle?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { leading, trailing, error, showPasswordToggle, type, className, style, ...props },
  ref,
) {
  const [showPwd, setShowPwd] = useState(false);
  const resolvedType = showPasswordToggle ? (showPwd ? 'text' : 'password') : type;

  return (
    <div className="relative flex items-center">
      {leading && (
        <span
          className="absolute left-3 pointer-events-none"
          style={{ color: 'var(--text-muted)' }}
        >
          {leading}
        </span>
      )}
      <input
        ref={ref}
        type={resolvedType}
        className={cn(
          'w-full rounded-xl px-3 py-3 text-sm outline-none transition-all duration-150',
          leading && 'pl-10',
          (trailing || showPasswordToggle) && 'pr-10',
          className,
        )}
        style={{
          background: 'var(--bg-muted)',
          color: 'var(--text-primary)',
          border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = error ? 'var(--danger)' : 'var(--accent)';
          e.currentTarget.style.boxShadow = error
            ? '0 0 0 3px var(--danger-muted)'
            : '0 0 0 3px var(--accent-muted)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? 'var(--danger)' : 'var(--border)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        {...props}
      />
      {showPasswordToggle && (
        <button
          type="button"
          onClick={() => setShowPwd((v) => !v)}
          className="absolute right-3 transition-colors duration-150"
          style={{ color: 'var(--text-muted)' }}
          tabIndex={-1}
        >
          {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      )}
      {trailing && !showPasswordToggle && (
        <span className="absolute right-3">{trailing}</span>
      )}
    </div>
  );
});

// ─── Country select ───────────────────────────────────────────────────────────

interface CountrySelectProps {
  id: string;
  value: string;
  onChange: (val: string) => void;
  options: Array<{ value: string; label: string }>;
  error?: string;
}

function CountrySelect({ id, value, onChange, options, error }: CountrySelectProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()),
  );
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 rounded-xl px-3 py-3 text-sm text-left transition-all duration-150"
        style={{
          background: 'var(--bg-muted)',
          color: selected ? 'var(--text-primary)' : 'var(--text-muted)',
          border: `1px solid ${error ? 'var(--danger)' : open ? 'var(--accent)' : 'var(--border)'}`,
          boxShadow: open
            ? `0 0 0 3px ${error ? 'var(--danger-muted)' : 'var(--accent-muted)'}`
            : 'none',
        }}
      >
        <Globe className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
        <span className="flex-1">{selected?.label || 'Select your country'}</span>
        <ChevronDown
          className={cn('h-4 w-4 flex-shrink-0 transition-transform duration-150', open && 'rotate-180')}
          style={{ color: 'var(--text-muted)' }}
        />
      </button>

      {open && (
        <div
          className="absolute z-50 left-0 right-0 mt-1 rounded-xl overflow-hidden shadow-2xl"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
          }}
        >
          <div className="p-2">
            <input
              type="text"
              placeholder="Search country…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full rounded-lg px-3 py-2 text-xs outline-none"
              style={{
                background: 'var(--bg-muted)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
            />
          </div>
          <ul className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                No results
              </li>
            ) : (
              filtered.map((o) => (
                <li key={o.value}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                      setSearch('');
                    }}
                    className="w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors duration-100"
                    style={{
                      color: 'var(--text-primary)',
                      background: o.value === value ? 'var(--accent-muted)' : 'transparent',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        o.value === value ? 'var(--accent-muted)' : 'var(--hover-bg)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        o.value === value ? 'var(--accent-muted)' : 'transparent')
                    }
                  >
                    {o.label}
                    {o.value === value && (
                      <Check className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Promo trailing icon ──────────────────────────────────────────────────────

function PromoTrailing({ state }: { state: PromoState }): JSX.Element | null {
  if (state.status === 'checking')
    return (
      <svg
        className="animate-spin h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        style={{ color: 'var(--text-muted)' }}
      >
        <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
        <path d="M12 2a10 10 0 0 1 10 10" />
      </svg>
    );
  if (state.status === 'valid')
    return <Check className="h-4 w-4" style={{ color: 'var(--success)' }} />;
  if (state.status === 'invalid')
    return <X className="h-4 w-4" style={{ color: 'var(--danger)' }} />;
  return null;
}

function PromoHelper({ state }: { state: PromoState }): JSX.Element | null {
  if (state.status === 'idle')
    return (
      <span style={{ color: 'var(--text-muted)' }}>
        Optional — 6–12 alphanumeric characters.
      </span>
    );
  if (state.status === 'checking')
    return <span style={{ color: 'var(--text-muted)' }}>Checking code…</span>;
  if (state.status === 'valid')
    return <span style={{ color: 'var(--success)' }}>✓ Valid promo code applied</span>;
  if (state.status === 'invalid') {
    const msg =
      state.reason === 'format'
        ? '✗ Invalid format (6–12 alphanumeric)'
        : state.reason === 'inactive'
        ? '✗ Code is no longer active'
        : '✗ Code not found';
    return <span style={{ color: 'var(--danger)' }}>{msg}</span>;
  }
  return null;
}

// ─── RegisterForm ─────────────────────────────────────────────────────────────

export function RegisterForm({
  onSubmit,
  serverError,
  isSubmitting = false,
  countries,
  validatePromo,
}: RegisterFormProps): JSX.Element {
  const [values, setValues] = useState<RegisterFormValues>({
    name: '',
    email: '',
    password: '',
    country: '',
    promoCode: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormValues, string>>>({});
  const [promoState, setPromoState] = useState<PromoState>({ status: 'idle' });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [agreed, setAgreed] = useState(false);

  // Live promo validation
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const raw = (values.promoCode || '').trim();
    if (!raw) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPromoState({ status: 'idle' });
      return;
    }
    if (!/^[A-Za-z0-9]{6,12}$/.test(raw)) {
      setPromoState({ status: 'invalid', reason: 'format' });
      return;
    }
    setPromoState({ status: 'checking' });
    debounceRef.current = setTimeout(async () => {
      if (!validatePromo) {
        setPromoState({ status: 'valid', code: raw });
        return;
      }
      try {
        const resp = await validatePromo(raw);
        if (resp.valid && resp.code) {
          setPromoState({ status: 'valid', code: resp.code });
        } else {
          setPromoState({
            status: 'invalid',
            reason: (resp.reason as 'not_found' | 'inactive' | 'format') || 'not_found',
          });
        }
      } catch {
        setPromoState({ status: 'invalid', reason: 'not_found' });
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [values.promoCode, validatePromo]);

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!values.name.trim() || values.name.trim().length < 2)
      next.name = 'Full name is required';
    if (!values.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      next.email = 'Enter a valid email address';
    if (!values.password || values.password.length < 8)
      next.password = 'Password must be at least 8 characters';
    if (!values.country) next.country = 'Please select your country';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!validate()) return;
    if (values.promoCode && promoState.status === 'invalid') return;
    await onSubmit({
      ...values,
      promoCode: values.promoCode?.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {/* Name */}
      <FormField label="Full name" htmlFor="name" error={errors.name}>
        <Input
          id="name"
          type="text"
          autoComplete="name"
          placeholder="Jane Trader"
          leading={<UserIcon className="h-4 w-4" />}
          error={errors.name}
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
        />
      </FormField>

      {/* Email */}
      <FormField label="Email address" htmlFor="reg-email" error={errors.email}>
        <Input
          id="reg-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          leading={<Mail className="h-4 w-4" />}
          error={errors.email}
          value={values.email}
          onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
        />
      </FormField>

      {/* Password + strength */}
      <FormField label="Password" htmlFor="reg-password" error={errors.password}>
        <Input
          id="reg-password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          showPasswordToggle
          leading={<Lock className="h-4 w-4" />}
          error={errors.password}
          value={values.password}
          onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
        />
        {values.password && (
          <PasswordStrengthMeter password={values.password} className="mt-2" />
        )}
      </FormField>

      {/* Country */}
      <FormField label="Country of residence" htmlFor="country" error={errors.country}>
        <CountrySelect
          id="country"
          value={values.country}
          onChange={(val) => setValues((v) => ({ ...v, country: val }))}
          options={countries}
          error={errors.country}
        />
      </FormField>

      {/* Promo code */}
      <FormField
        label="Promo / referral code (optional)"
        htmlFor="promoCode"
        helper={<PromoHelper state={promoState} />}
      >
        <Input
          id="promoCode"
          type="text"
          autoCapitalize="characters"
          placeholder="e.g. BANE2025"
          leading={<Tag className="h-4 w-4" />}
          trailing={<PromoTrailing state={promoState} />}
          value={values.promoCode}
          onChange={(e) => setValues((v) => ({ ...v, promoCode: e.target.value.toUpperCase() }))}
        />
      </FormField>

      {/* Terms checkbox */}
      <label className="flex items-start gap-2.5 cursor-pointer select-none">
        <div
          className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-2 flex items-center justify-center transition-all duration-150"
          style={{
            background: agreed ? 'var(--accent)' : 'var(--bg-muted)',
            borderColor: agreed ? 'var(--accent)' : 'var(--border)',
          }}
          onClick={() => setAgreed((v) => !v)}
        >
          {agreed && (
            <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
              <path
                d="M1 3L3 5L7 1"
                stroke="var(--text-inverse)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
        <span className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          I agree to BaneTrading`s{' '}
          <Link
            href="/terms"
            className="font-medium"
            style={{ color: 'var(--accent)' }}
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            href="/privacy"
            className="font-medium"
            style={{ color: 'var(--accent)' }}
          >
            Privacy Policy
          </Link>
        </span>
      </label>

      {/* Server error */}
      {serverError && (
        <div
          role="alert"
          className="rounded-xl px-4 py-3 text-xs flex items-start gap-2"
          style={{
            background: 'var(--danger-muted)',
            border: '1px solid var(--danger)',
            color: 'var(--danger)',
          }}
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          {serverError}
        </div>
      )}

      {/* CTA */}
      <button
        type="submit"
        disabled={isSubmitting || !agreed}
        className="w-full relative flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all duration-150"
        style={{
          background:
            isSubmitting || !agreed ? 'var(--disabled)' : 'var(--accent)',
          color: isSubmitting || !agreed ? 'var(--disabled-text)' : 'var(--text-inverse)',
          cursor: isSubmitting || !agreed ? 'not-allowed' : 'pointer',
        }}
        onMouseEnter={(e) => {
          if (!isSubmitting && agreed)
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-hover)';
        }}
        onMouseLeave={(e) => {
          if (!isSubmitting && agreed)
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)';
        }}
      >
        {isSubmitting ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
            Creating account…
          </>
        ) : (
          'Create account'
        )}
      </button>
    </form>
  );
}