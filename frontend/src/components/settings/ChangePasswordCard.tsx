// components/settings/ChangePasswordCard.tsx
// ── Password card: collapsed summary → expand → form ──

import { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, KeyRound, Lock, X } from 'lucide-react';

import { FormField } from '@/components/auth/FormField';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { toast } from '@/components/ui/Toast';
import { useProfile } from '@/hooks/useProfile';
import { changePasswordFormSchema, ChangePasswordFormValues } from '@/lib/validators';
import { cn } from '@/lib/cn';
import type { NormalizedApiError } from '@/services/apiClient';

function daysSince(iso?: string): string {
  if (!iso) return 'Never';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Never';
  const days = Math.floor((Date.now() - date.getTime()) / (24 * 3600 * 1000));
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  if (days < 60) return '1 month ago';
  const months = Math.floor(days / 30);
  return `${months} months ago`;
}

export function ChangePasswordCard(): JSX.Element | null {
  const router = useRouter();
  const { profile, changePassword, isChangingPassword } = useProfile();
  const [expanded, setExpanded] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const newPassword = watch('newPassword') || '';

  if (!profile) return null;

  const summary = `Last changed ${daysSince(profile.passwordUpdatedAt)}`;

  const close = (): void => {
    setExpanded(false);
    setServerError(null);
    reset();
  };

  const onSubmit = async (values: ChangePasswordFormValues): Promise<void> => {
    setServerError(null);
    try {
      await changePassword(values.currentPassword, values.newPassword);
      reset();
      toast.success('Password changed. Please log in again.');
      router.push('/auth/login');
    } catch (err) {
      const e2 = err as NormalizedApiError;
      setServerError(e2.message || 'Could not change password');
    }
  };

  return (
    <Card padded={false}>
      {/* Header / collapsed row */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls="change-password-panel"
        className="flex w-full items-center justify-between gap-3 rounded-card px-5 py-4 text-left transition-colors hover:bg-hover-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-text-secondary shrink-0">
            <KeyRound className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-text-primary">Password</div>
            <div className="text-xs text-text-muted truncate">{summary}</div>
          </div>
        </div>
        <ChevronDown className={cn('h-4 w-4 text-text-muted transition-transform', expanded && 'rotate-180')} />
      </button>

      {/* Expanded form */}
      {expanded && (
        <div id="change-password-panel" className="border-t border-border px-5 py-5">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <FormField label="Current password" htmlFor="currentPassword" error={errors.currentPassword?.message}>
              <Input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your current password"
                leading={<KeyRound className="h-4 w-4" />}
                showPasswordToggle
                error={errors.currentPassword?.message}
                {...register('currentPassword')}
              />
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="New password" htmlFor="newPassword" error={errors.newPassword?.message}>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  leading={<Lock className="h-4 w-4" />}
                  showPasswordToggle
                  error={errors.newPassword?.message}
                  {...register('newPassword')}
                />
              </FormField>

              <FormField label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Re-enter the new password"
                  leading={<Lock className="h-4 w-4" />}
                  showPasswordToggle
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
              </FormField>
            </div>

            <PasswordStrengthMeter password={newPassword} />

            <p className="rounded-input border border-warning/40 bg-warning-muted px-3 py-2 text-xs text-warning">
              Changing your password will sign you out of all sessions, including this one.
            </p>

            {serverError && (
              <div role="alert" className="rounded-input border border-danger/40 bg-danger-muted px-3 py-2 text-xs text-danger">
                {serverError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                leadingIcon={<X className="h-3.5 w-3.5" />}
                onClick={close}
                disabled={isSubmitting || isChangingPassword}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={isSubmitting || isChangingPassword}>
                Change password
              </Button>
            </div>
          </form>
        </div>
      )}
    </Card>
  );
}