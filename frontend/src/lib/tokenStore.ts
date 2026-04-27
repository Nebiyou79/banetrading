// lib/tokenStore.ts
// ── Token persistence (localStorage) ──

const ACCESS_KEY  = 'pbt_access_token';
const REFRESH_KEY = 'pbt_refresh_token';

function hasWindow(): boolean {
  return typeof window !== 'undefined';
}

export const tokenStore = {
  getAccess(): string | null {
    if (!hasWindow()) return null;
    return window.localStorage.getItem(ACCESS_KEY);
  },
  getRefresh(): string | null {
    if (!hasWindow()) return null;
    return window.localStorage.getItem(REFRESH_KEY);
  },
  set(access: string, refresh: string): void {
    if (!hasWindow()) return;
    window.localStorage.setItem(ACCESS_KEY, access);
    window.localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear(): void {
    if (!hasWindow()) return;
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  },
};

export const TOKEN_KEYS = { ACCESS_KEY, REFRESH_KEY };