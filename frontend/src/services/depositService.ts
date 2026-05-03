// services/depositService.ts
// ── Typed wrappers for deposit endpoints ──
//
// BALANCE FIX:
// BalanceResponse now includes `lockedBalances` (amounts held pending
// withdrawal) in addition to `balances` (available amounts).

import { apiClient } from './apiClient';
import type {
  BalanceResponse,
  DepositsListResponse,
  SubmitDepositInput,
  SubmitDepositResponse,
} from '@/types/funds';

export const depositService = {
  /** Returns available balances, locked balances, and freeze status */
  async getBalance(): Promise<BalanceResponse> {
    const { data } = await apiClient.get<BalanceResponse>('/funds/balance');
    return data;
  },

  async submitDeposit(input: SubmitDepositInput): Promise<SubmitDepositResponse> {
    const form = new FormData();
    form.append('amount',   String(input.amount));
    form.append('currency', input.currency);
    form.append('network',  input.network); // already in unified format ('USDT-ERC20', 'BTC', etc.)
    if (input.note)  form.append('note',  input.note);
    if (input.proof) form.append('proof', input.proof);

    const { data } = await apiClient.post<SubmitDepositResponse>('/funds/deposit', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async getMyDeposits(limit = 20, skip = 0): Promise<DepositsListResponse> {
    const { data } = await apiClient.get<DepositsListResponse>(
      `/funds/deposits/me?limit=${limit}&skip=${skip}`,
    );
    return data;
  },
};