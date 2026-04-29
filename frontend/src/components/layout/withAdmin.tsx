// components/layout/withAdmin.tsx
// ── Admin route guard (chains on top of withAuth) ──

import { ComponentType } from 'react';
import Link from 'next/link';
import { ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { withAuth } from './withAuth';
import { AuthenticatedShell } from './AuthenticatedShell';

function ForbiddenScreen(): JSX.Element {
  return (
    <AuthenticatedShell>
      <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 py-20 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 text-danger">
          <ShieldOff className="h-6 w-6" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">403 — Access denied</h1>
        <p className="text-sm text-text-secondary leading-relaxed">
          You don&apos;t have access to this page. If you believe this is a mistake, please contact an administrator.
        </p>
        <Link href="/dashboard">
          <Button variant="secondary">Back to dashboard</Button>
        </Link>
      </div>
    </AuthenticatedShell>
  );
}

export function withAdmin<P extends object>(Component: ComponentType<P>): ComponentType<P> {
  function AdminGuarded(props: P): JSX.Element {
    const { user } = useAuth();
    if (!user) return <ForbiddenScreen />;
    if (user.role !== 'admin') return <ForbiddenScreen />;
    return <Component {...props} />;
  }
  AdminGuarded.displayName = `withAdmin(${Component.displayName || Component.name || 'Component'})`;
  // Compose with withAuth so the page is also auth-gated.
  return withAuth(AdminGuarded);
}