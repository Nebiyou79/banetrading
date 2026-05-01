// components/ui/AdminRoute.tsx
// ── Protected route wrapper for admin pages ──

'use client';

import React from 'react';
import { useRouter } from 'next/router';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { adminUser, isLoading } = useAdminAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !adminUser) {
      router.replace('/admin/login');
    }
  }, [isLoading, adminUser, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: 'var(--primary)' }}></div>
      </div>
    );
  }

  if (!adminUser) {
    return null;
  }

  return <>{children}</>;
}