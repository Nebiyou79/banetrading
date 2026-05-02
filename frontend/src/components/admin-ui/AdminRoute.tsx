// components/ui/AdminRoute.tsx
// ── Protected route wrapper for admin pages ──

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Mark as mounted on client to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if not admin (only on client)
  useEffect(() => {
    if (mounted && !isLoading && (!user || user.role !== 'admin')) {
      router.replace('/admin/login');
    }
  }, [mounted, isLoading, user, router]);

  // Show loading state that matches server render
  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: 'var(--primary)' }}></div>
      </div>
    );
  }

  // Not admin - don't render anything (will redirect)
  if (!user || user.role !== 'admin') {
    return null;
  }

  // Admin authenticated - render children
  return <>{children}</>;
}