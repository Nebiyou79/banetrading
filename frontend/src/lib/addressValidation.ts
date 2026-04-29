// lib/addressValidation.ts
// ── Best-effort client-side address validation per network ──
// These are sanity checks only — the source of truth is the backend.

import type { WithdrawNetwork } from '@/types/funds';

const BTC_REGEX  = /^(bc1[a-z0-9]{25,90}|[13][a-km-zA-HJ-NP-Z1-9]{25,39})$/;
const ETH_REGEX  = /^0x[a-fA-F0-9]{40}$/;
const TRC20_REGEX = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;

export function validateAddressForNetwork(network: WithdrawNetwork, address: string): { valid: boolean; reason?: string } {
  const a = address.trim();
  if (!a) return { valid: false, reason: 'Address is required' };
  if (a.length < 8) return { valid: false, reason: 'Address is too short' };

  if (network === 'BTC') {
    if (!BTC_REGEX.test(a)) return { valid: false, reason: 'Address does not look like a Bitcoin address' };
    return { valid: true };
  }
  if (network === 'ETH' || network === 'USDT-ERC20' || network === 'USDT-BEP20') {
    if (!ETH_REGEX.test(a)) {
      return { valid: false, reason: 'Address must be 0x followed by 40 hex characters' };
    }
    return { valid: true };
  }
  if (network === 'USDT-TRC20') {
    if (!TRC20_REGEX.test(a)) return { valid: false, reason: 'TRC20 addresses must start with T and be 34 characters' };
    return { valid: true };
  }
  return { valid: true };
}