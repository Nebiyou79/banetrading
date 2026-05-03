// services/depositService.ts
// Typed wrappers for deposit endpoints.
//
// NETWORK NORMALISATION FIX:
// The frontend may still have old DepositNetwork values in state
// ('ERC20', 'TRC20', 'BEP20', 'Bitcoin', 'Ethereum') if types/funds.ts
// has not been updated yet in the project.
// This service normalises the network value to the unified format that the
// backend now expects ('USDT-ERC20', 'USDT-TRC20', 'USDT-BEP20', 'BTC', 'ETH')
// before sending, so deposits work regardless of which version of the types
// file is deployed.

import { apiClient } from './apiClient';
import type {
  BalanceResponse,
  DepositsListResponse,
  SubmitDepositInput,
  SubmitDepositResponse,
} from '@/types/funds';

/**
 * Maps both old and new network string formats to the unified backend value.
 * Old format: 'ERC20', 'TRC20', 'BEP20', 'Bitcoin', 'Ethereum'
 * New format (pass-through): 'USDT-ERC20', 'USDT-TRC20', 'USDT-BEP20', 'BTC', 'ETH'
 */
const NETWORK_NORMALISE: Record<string, string> = {
  // Old values -> new unified values
  'ERC20':    'USDT-ERC20',
  'TRC20':    'USDT-TRC20',
  'BEP20':    'USDT-BEP20',
  'Bitcoin':  'BTC',
  'Ethereum': 'ETH',
  // New values -> pass through unchanged
  'USDT-ERC20': 'USDT-ERC20',
  'USDT-TRC20': 'USDT-TRC20',
  'USDT-BEP20': 'USDT-BEP20',
  'BTC':        'BTC',
  'ETH':        'ETH',
};

function normaliseNetwork(network: string): string {
  const mapped = NETWORK_NORMALISE[network];
  if (!mapped) {
    console.warn('[depositService] unknown network value:', network, '— sending as-is');
    return network;
  }
  return mapped;
}

export const depositService = {
  /** Returns available balances, locked balances, and freeze status */
  async getBalance(): Promise<BalanceResponse> {
    const { data } = await apiClient.get<BalanceResponse>('/funds/balance');
    return data;
  },

  async submitDeposit(input: SubmitDepositInput): Promise<SubmitDepositResponse> {
    const normalisedNetwork = normaliseNetwork(input.network as string);

    const form = new FormData();
    form.append('amount',   String(input.amount));
    form.append('currency', input.currency);
    form.append('network',  normalisedNetwork);
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