// components/settings/SettingsLayout.tsx
// ── Wraps /settings/* pages with the shared header + tabs ──

import { ReactNode } from 'react';
import { SettingsTabs } from './SettingsTabs';

export function SettingsLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-text-primary">
          Settings
        </h1>
        <p className="text-sm text-text-secondary">
          Manage your account security and verification
        </p>
      </header>

      <SettingsTabs />

      <div>{children}</div>
    </div>
  );
}