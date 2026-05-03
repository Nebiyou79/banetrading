// types/funds.ts
// ── Funds domain types ──
//
// BALANCE FIX:
// 1. BalanceResponse now includes `lockedBalances` (pending-withdrawal amounts).
// 2. DepositNetwork enum unified to match backend Deposit.network enum.
// 3. WithdrawalRecord includes `netAmount` and `networkFee` for display.
// 4. COINS and network maps updated to be the single source of truth.

// ── Currency atoms ──────────────────────────────────────────────────────────

export type Coin = 'USDT' | 'BTC' | 'ETH';

export const COINS: Coin[] = ['USDT', 'BTC', 'ETH'];

// ── Deposit networks ──
// These values are stored verbatim in Deposit.network on the backend.
// Previously the backend used 'ERC20'/'TRC20'/'BEP20'/'Bitcoin'/'Ethereum' —
// the backend model is now updated to use these unified values instead.
export type DepositNetwork = 'USDT-ERC20' | 'USDT-TRC20' | 'USDT-BEP20' | 'BTC' | 'ETH';

// ── Withdrawal networks (same values, typed separately for clarity) ──
export type WithdrawNetwork = 'USDT-ERC20' | 'USDT-TRC20' | 'USDT-BEP20' | 'BTC' | 'ETH';

// ── Networks available per coin ──────────────────────────────────────────────

export const DEPOSIT_NETWORKS_FOR_COIN: Record<Coin, DepositNetwork[]> = {
  USDT: ['USDT-ERC20', 'USDT-TRC20', 'USDT-BEP20'],
  BTC:  ['BTC'],
  ETH:  ['ETH'],
};

export const WITHDRAW_NETWORKS_FOR_COIN: Record<Coin, WithdrawNetwork[]> = {
  USDT: ['USDT-ERC20', 'USDT-TRC20', 'USDT-BEP20'],
  BTC:  ['BTC'],
  ETH:  ['ETH'],
};

// ── Coin/network label and address-key helpers ────────────────────────────────

const NETWORK_LABELS: Record<DepositNetwork | WithdrawNetwork, string> = {
  'USDT-ERC20': 'ERC20',
  'USDT-TRC20': 'TRC20',
  'USDT-BEP20': 'BEP20',
  BTC:          'Bitcoin',
  ETH:          'Ethereum',
};

// Address keys in DepositAddresses map (same as WithdrawNetwork / DepositNetwork values)
export type DepositAddressKey = 'USDT-ERC20' | 'USDT-TRC20' | 'USDT-BEP20' | 'BTC' | 'ETH';

export const CoinNetworkMap = {
  label(network: DepositNetwork | WithdrawNetwork): string {
    return NETWORK_LABELS[network] ?? network;
  },
  toAddressKey(coin: Coin, network: DepositNetwork): DepositAddressKey {
    // Network value IS the address key (already unified)
    return network as DepositAddressKey;
  },
};

// ── Balance types ─────────────────────────────────────────────────────────────

export interface BalanceResponse {
  /** Available balances — spendable amounts, keyed by currency symbol */
  balances: Record<string, number>;
  /** Locked balances — amounts held pending withdrawal approval */
  lockedBalances: Record<string, number>;
  currency: string;
  isFrozen: boolean;
}

export type DepositAddresses = Record<DepositAddressKey, string>;

export interface DepositAddressesResponse {
  addresses: DepositAddresses;
  updatedAt: string | null;
}

// ── Status ──────────────────────────────────────────────────────────────────

export type FundsStatus = 'pending' | 'approved' | 'rejected';

// ── Deposit types ────────────────────────────────────────────────────────────

export interface DepositRecord {
  _id:          string;
  userId:       string;
  amount:       number;
  currency:     string;
  network:      string;
  proofFilePath?: string;
  note?:        string;
  status:       FundsStatus;
  rejectionReason?: string;
  txHash?:      string;
  createdAt:    string;
  updatedAt:    string;
}

export interface DepositsListResponse {
  deposits: DepositRecord[];
  total:    number;
}

export interface SubmitDepositInput {
  amount:   number;
  currency: Coin;
  network:  DepositNetwork;
  note?:    string;
  proof?:   File | null;
}

export interface SubmitDepositResponse {
  message: string;
  deposit: DepositRecord;
}

// ── Withdrawal types ─────────────────────────────────────────────────────────

export interface WithdrawalRecord {
  _id:         string;
  userId:      string;
  amount:      number;       // gross amount (what user requested)
  currency:    string;
  network:     string;
  toAddress:   string;
  networkFee:  number;       // fee deducted
  netAmount:   number;       // amount recipient receives (amount - fee)
  status:      FundsStatus;
  txHash?:     string;
  note?:       string;
  rejectionReason?: string;
  createdAt:   string;
  updatedAt:   string;
}

export interface WithdrawalsListResponse {
  withdrawals: WithdrawalRecord[];
  total:       number;
}

export interface SubmitWithdrawInput {
  amount:    number;
  currency:  Coin;
  network:   WithdrawNetwork;
  toAddress: string;
  note?:     string;
}

export interface SubmitWithdrawResponse {
  message:        string;
  withdrawal:     WithdrawalRecord;
  newBalances:    Record<string, number>;
  lockedBalances: Record<string, number>;
}

// ── Network fee types ────────────────────────────────────────────────────────

export type NetworkFees = Record<WithdrawNetwork, number | null>;

export interface NetworkFeesResponse {
  fees: NetworkFees;
}

export interface UpdateFeeResponse {
  message:   string;
  network:   WithdrawNetwork;
  fee:       number;
  updatedAt: string;
}