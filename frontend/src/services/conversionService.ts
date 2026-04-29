// services/conversionService.ts
// ── CONVERSION API SERVICE ──

import { apiClient } from './apiClient';
import type {
  Currency,
  ConversionQuote,
  ConversionRecord,
  UserBalances,
  ConversionConfig,
} from '@/types/convert';

export const conversionService = {
  // ── Balances ──
  async getBalances(): Promise<UserBalances> {
    const { data } = await apiClient.get<UserBalances>('/convert/balances');
    return data;
  },

  // ── Quote ──
  async getQuote(payload: {
    from: Currency;
    to: Currency;
    fromAmount: number;
  }): Promise<ConversionQuote> {
    const { data } = await apiClient.post<ConversionQuote>('/convert/quote', payload);
    return data;
  },

  // ── Execute ──
  async executeConvert(payload: {
    from: Currency;
    to: Currency;
    fromAmount: number;
    quotedRate: number;
  }): Promise<{ rate: number; fromAmount: number; toAmount: number; conversionId: string }> {
    const { data } = await apiClient.post<{
      rate: number;
      fromAmount: number;
      toAmount: number;
      conversionId: string;
    }>('/convert/execute', payload);
    return data;
  },

  // ── History ──
  async getHistory(limit = 20): Promise<{ conversions: ConversionRecord[] }> {
    const { data } = await apiClient.get<{ conversions: ConversionRecord[] }>(
      `/convert/history?limit=${encodeURIComponent(String(limit))}`,
    );
    return data;
  },

  // ── Admin: Get config ──
  async getConfig(): Promise<{ config: ConversionConfig }> {
    const { data } = await apiClient.get<{ config: ConversionConfig }>('/convert/admin/config');
    return data;
  },

  // ── Admin: Update config ──
  async updateConfig(payload: {
    feeBps?: number;
    minConvertUsd?: number;
    enabledPairs?: string[];
  }): Promise<{ config: ConversionConfig }> {
    const { data } = await apiClient.put<{ config: ConversionConfig }>(
      '/convert/admin/config',
      payload,
    );
    return data;
  },
};