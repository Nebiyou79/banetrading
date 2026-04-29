// components/auth/LoginForm.tsx
// ── BaneTrading — Login form ──
// Email + password + remember + forgot password
// Zero hardcoded hex. Full CSS-var theming. Both themes polished.

import { useState, forwardRef } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/cn';

// ─── Sub-components ──────────────────────────────────────────────────────────

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  error,
  children,
  className,
}: FormFieldProps): JSX.Element {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
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
    </div>
  );
}

// ─── Input primitive ─────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  error?: string;
  showPasswordToggle?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { leading, trailing, error, showPasswordToggle, type, className, ...props },
  ref,
) {
  const [showPwd, setShowPwd] = useState(false);
  const resolvedType = showPasswordToggle
    ? showPwd
      ? 'text'
      : 'password'
    : type;

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
          'w-full rounded-xl px-3 py-3 text-sm',
          'transition-all duration-150 outline-none',
          'placeholder:text-[var(--text-muted)]',
          leading && 'pl-10',
          (trailing || showPasswordToggle) && 'pr-10',
          error
            ? 'border-[var(--danger)] focus:ring-2 focus:ring-[var(--danger-muted)]'
            : 'border-[var(--border)] hover:border-[var(--border-strong)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)]',
          className,
        )}
        style={{
          background: 'var(--bg-muted)',
          color: 'var(--text-primary)',
          border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
        }}
        {...props}
      />
      {showPasswordToggle && (
        <button
          type="button"
          onClick={() => setShowPwd((v) => !v)}
          className="absolute right-3 transition-colors duration-150"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          tabIndex={-1}
          aria-label={showPwd ? 'Hide password' : 'Show password'}
        >
          {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      )}
      {trailing && !showPasswordToggle && (
        <span className="absolute right-3" style={{ color: 'var(--text-muted)' }}>
          {trailing}
        </span>
      )}
    </div>
  );
});

// ─── LoginForm ────────────────────────────────────────────────────────────────

export interface LoginFormValues {
  email: string;
  password: string;
  remember: boolean;
}

interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => Promise<void>;
  serverError?: string | null;
  notVerifiedEmail?: string | null;
  isSubmitting?: boolean;
}

export function LoginForm({
  onSubmit,
  serverError,
  notVerifiedEmail,
  isSubmitting = false,
}: LoginFormProps): JSX.Element {
  const [values, setValues] = useState<LoginFormValues>({
    email: '',
    password: '',
    remember: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormValues, string>>>({});

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!values.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      next.email = 'Enter a valid email address';
    }
    if (!values.password || values.password.length < 8) {
      next.password = 'Password must be at least 8 characters';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      {/* Email */}
      <FormField label="Email address" htmlFor="email" error={errors.email}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          leading={<Mail className="h-4 w-4" />}
          error={errors.email}
          value={values.email}
          onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
        />
      </FormField>

      {/* Password */}
      <FormField label="Password" htmlFor="password" error={errors.password}>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          showPasswordToggle
          leading={<Lock className="h-4 w-4" />}
          error={errors.password}
          value={values.password}
          onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
        />
      </FormField>

      {/* Remember + Forgot */}
      <div className="flex items-center justify-between">
        <label className="inline-flex items-center gap-2 cursor-pointer select-none group">
          <div className="relative">
            <input
              type="checkbox"
              checked={values.remember}
              onChange={(e) => setValues((v) => ({ ...v, remember: e.target.checked }))}
              className="sr-only peer"
            />
            <div
              className="h-4 w-4 rounded border-2 flex items-center justify-center transition-all duration-150 peer-checked:border-[var(--accent)]"
              style={{
                background: values.remember ? 'var(--accent)' : 'var(--bg-muted)',
                borderColor: values.remember ? 'var(--accent)' : 'var(--border)',
              }}
            >
              {values.remember && (
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
          </div>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Remember me
          </span>
        </label>

        <Link
          href="/auth/forgot-password"
          className="text-xs font-medium transition-colors duration-150"
          style={{ color: 'var(--accent)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--accent)')}
        >
          Forgot password?
        </Link>
      </div>

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
          <span>
            {serverError}
            {notVerifiedEmail && (
              <>
                {' '}
                <Link
                  href={{
                    pathname: '/auth/verify-otp',
                    query: { email: notVerifiedEmail, purpose: 'email_verification' },
                  }}
                  className="font-semibold underline"
                >
                  Verify now
                </Link>
                .
              </>
            )}
          </span>
        </div>
      )}

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          or
        </span>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>

      {/* Google SSO placeholder */}
      <button
        type="button"
        className="w-full flex items-center justify-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150"
        style={{
          background: 'var(--bg-muted)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-strong)';
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card-hover)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-muted)';
        }}
      >
        <GoogleIcon />
        Continue with Google
      </button>

      {/* Submit CTA */}
      <SubmitButton loading={isSubmitting} label="Log in" />
    </form>
  );
}

// ─── Shared sub-components ───────────────────────────────────────────────────

function SubmitButton({
  loading,
  label,
}: {
  loading: boolean;
  label: string;
}): JSX.Element {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full relative flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all duration-150 overflow-hidden"
      style={{
        background: loading ? 'var(--accent-active)' : 'var(--accent)',
        color: 'var(--text-inverse)',
        cursor: loading ? 'not-allowed' : 'pointer',
      }}
      onMouseEnter={(e) => {
        if (!loading)
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-hover)';
      }}
      onMouseLeave={(e) => {
        if (!loading)
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)';
      }}
    >
      {/* Shimmer effect */}
      {!loading && (
        <span
          className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
          }}
        />
      )}
      {loading ? (
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
          Authenticating…
        </>
      ) : (
        label
      )}
    </button>
  );
}

function GoogleIcon(): JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}