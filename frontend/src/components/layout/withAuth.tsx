// components/layout/withAuth.tsx
// ── Route-protection HOC for authenticated pages ──

import { ComponentType, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { tokenStore } from '@/lib/tokenStore';
import { Spinner } from '@/components/ui/Spinner';

export function withAuth<P extends object>(Component: ComponentType<P>): ComponentType<P> {
  function Guarded(props: P): JSX.Element | null {
    const router = useRouter();
    const { user, isLoading, isAuthenticated } = useAuth();

    const hasToken = typeof window !== 'undefined' && !!tokenStore.getAccess();

    useEffect(() => {
      if (!router.isReady) return;
      if (!hasToken) {
        router.replace({
          pathname: '/auth/login',
          query: { redirect: router.asPath },
        });
        return;
      }
      if (!isLoading && !isAuthenticated && !user) {
        router.replace({
          pathname: '/auth/login',
          query: { redirect: router.asPath },
        });
      }
    }, [router, hasToken, isLoading, isAuthenticated, user]);

    if (!hasToken || isLoading || !user) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-base">
          <Spinner size="lg" className="text-accent" />
        </div>
      );
    }
    return <Component {...props} />;
  }
  Guarded.displayName = `withAuth(${Component.displayName || Component.name || 'Component'})`;
  return Guarded;
}