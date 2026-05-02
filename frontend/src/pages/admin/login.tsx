// pages/admin/login.tsx
// ── Admin login page ──

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { login, user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated && user?.role === 'admin') {
      router.replace('/admin/dashboard');
    }
  }, [mounted, isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login({ email, password });
      if (response.user?.role !== 'admin') {
        setError('Access denied. Not an admin account.');
        try {
          const { authService } = await import('@/services/authService');
          await authService.logout();
        } catch {}
        return;
      }
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: 'var(--primary)' }}></div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div
        className="w-full max-w-md p-8 rounded-2xl"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="text-center mb-8">
          {/* Admin badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 text-xs font-medium"
            style={{ backgroundColor: 'var(--danger-muted)', color: 'var(--danger)' }}>
            <span>🛡️</span>
            Admin Access Only
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Admin Login
          </h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
            Enter your admin credentials to access the dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              className="px-4 py-3 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--danger-muted)', color: 'var(--danger)' }}
            >
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--text-inverse)',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In to Admin Panel'}
          </button>
        </form>

        {/* Link back to user login */}
        <div className="mt-6 text-center">
          <Link
            href="/auth/login"
            className="text-sm transition-colors hover:underline"
            style={{ color: 'var(--text-secondary)' }}
          >
            ← Back to user login
          </Link>
        </div>
      </div>
    </div>
  );
}