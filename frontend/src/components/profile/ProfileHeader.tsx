// components/profile/ProfileHeader.tsx
// ── Header strip for the profile page ──

import { Mail } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Pill, PillTone } from '@/components/ui/Pill';
import type { UserProfile, KycStatus } from '@/types/profile';

export interface ProfileHeaderProps {
  user: UserProfile | null;  // Allow null
}

const KYC_TONE: Record<KycStatus, PillTone> = {
  none:     'neutral',
  pending:  'warning',
  approved: 'success',
  rejected: 'danger',
};

const KYC_LABEL: Record<KycStatus, string> = {
  none:     'Not started',
  pending:  'Pending',
  approved: 'Verified',
  rejected: 'Rejected',
};

export function ProfileHeader({ user }: ProfileHeaderProps): JSX.Element {
  // Handle null/undefined user
  if (!user) {
    return (
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-muted)] animate-pulse" />
          <div className="min-w-0 space-y-2">
            <div className="h-6 w-48 bg-[var(--bg-muted)] rounded animate-pulse" />
            <div className="h-4 w-32 bg-[var(--bg-muted)] rounded animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  const label = user.name || user.name || 'User';

  return (
    <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <Avatar src={user.avatarUrl} name={label} size="lg" />
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-text-primary truncate">
            {label}
          </h1>
          <div className="mt-1 inline-flex items-center gap-1.5 text-xs text-text-muted">
            <Mail className="h-3.5 w-3.5" />
            <span className="truncate">{user.email}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {user.kycStatus && <Pill tone={KYC_TONE[user.kycStatus]}>{KYC_LABEL[user.kycStatus]}</Pill>}
        {user.kycTier > 0 && <Pill tone="neutral">Tier {user.kycTier}</Pill>}
        {user.role === 'admin' && <Pill tone="accent">Admin</Pill>}
        {user.isFrozen && <Pill tone="danger">Frozen</Pill>}
      </div>
    </section>
  );
}