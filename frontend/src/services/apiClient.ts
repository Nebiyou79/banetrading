// services/apiClient.ts
// ── Axios client with auth header + silent refresh on 401 ──

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import { tokenStore } from '../lib/tokenStore';
import type { RefreshResponse } from '../types/auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _skipAuth?: boolean;
}

// ── Request interceptor: attach access token ──
apiClient.interceptors.request.use((config) => {
  const cfg = config as RetriableConfig;
  if (cfg._skipAuth) return cfg;
  const token = tokenStore.getAccess();
  if (token) {
    cfg.headers = cfg.headers ?? {};
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

// ── Silent refresh plumbing (single-flight) ──
let refreshPromise: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) return null;
  try {
    const resp = await axios.post<RefreshResponse>(
      `${BASE_URL}/auth/refresh`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' } },
    );
    tokenStore.set(resp.data.accessToken, resp.data.refreshToken);
    return resp.data.accessToken;
  } catch {
    tokenStore.clear();
    return null;
  }
}

function ensureRefresh(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// ── Response interceptor: refresh on 401 once, then retry ──
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    if (!original || status !== 401 || original._retry || original._skipAuth) {
      return Promise.reject(error);
    }

    // Don't try to refresh calls TO /auth/refresh or /auth/login itself
    const url = original.url || '';
    if (url.includes('/auth/refresh') || url.includes('/auth/login') || url.includes('/auth/register')) {
      return Promise.reject(error);
    }

    original._retry = true;

    const newAccess = await ensureRefresh();
    if (!newAccess) {
      if (typeof window !== 'undefined') {
        tokenStore.clear();
        if (!window.location.pathname.startsWith('/auth/')) {
          window.location.href = '/auth/login';
        }
      }
      return Promise.reject(error);
    }

    original.headers = original.headers ?? {};
    original.headers.Authorization = `Bearer ${newAccess}`;
    return apiClient(original);
  },
);

// ── Error normalization helper ──
export interface NormalizedApiError {
  message: string;
  status?: number;
  code?: string;
  errors?: Array<{ path: string; message: string }>;
}

export function normalizeError(err: unknown): NormalizedApiError {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string; code?: string; errors?: Array<{ path: string; message: string }> }
      | undefined;
    return {
      message: data?.message || err.message || 'Request failed',
      status: err.response?.status,
      code: data?.code,
      errors: data?.errors,
    };
  }
  if (err instanceof Error) return { message: err.message };
  return { message: 'Unknown error' };
}

export type { AxiosRequestConfig };