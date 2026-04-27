// lib/media.ts
// ── Media URL helpers ──

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Resolve a relative `/uploads/...` path returned by the API into an absolute
 * URL pointing at the backend host (the API base URL without its trailing
 * `/api` segment). Absolute URLs are passed through.
 */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const base = API_URL.replace(/\/api\/?$/i, '');
  const leading = url.startsWith('/') ? url : `/${url}`;
  return `${base}${leading}`;
}

/**
 * Produce deterministic initials from a user's preferred name.
 */
export function getInitials(name?: string | null, max = 2): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const letters = parts.slice(0, max).map((p) => p.charAt(0).toUpperCase());
  return letters.join('') || '?';
}