// types/funds.ts
// ── Funds: deposit / withdrawal / addresses / fees types ──

export type Coin = 'USDT' | 'BTC' | 'ETH';

/** Deposit-side network values (as stored on Deposit.network). */
export type DepositNetwork = 'ERC20' | 'TRC20' | 'BEP20' | 'Bitcoin' | 'Ethereum';

/** Withdraw-side & address-book / fee keys (coin-prefixed). */
export type WithdrawNetwork = 'USDT-ERC20' | 'USDT-TRC20' | 'USDT-BEP20' | 'BTC' | 'ETH';

export type FundsStatus = 'pending' | 'approved' | 'rejected';

export const COINS: Coin[] = ['USDT', 'BTC', 'ETH'];

export const ALL_WITHDRAW_NETWORKS: WithdrawNetwork[] = [
  'USDT-ERC20', 'USDT-TRC20', 'USDT-BEP20', 'BTC', 'ETH',
];

/** Coin → allowed deposit networks. */
export const DEPOSIT_NETWORKS_FOR_COIN: Record<Coin, DepositNetwork[]> = {
  USDT: ['ERC20', 'TRC20', 'BEP20'],
  BTC:  ['Bitcoin'],
  ETH:  ['Ethereum'],
};

/** Coin → allowed withdraw networks. */
export const WITHDRAW_NETWORKS_FOR_COIN: Record<Coin, WithdrawNetwork[]> = {
  USDT: ['USDT-ERC20', 'USDT-TRC20', 'USDT-BEP20'],
  BTC:  ['BTC'],
  ETH:  ['ETH'],
};

/** Map a deposit-side selection (coin, depositNetwork) to the address-book / fee key. */
export const CoinNetworkMap = {
  toAddressKey(coin: Coin, network: DepositNetwork): WithdrawNetwork {
    if (coin === 'USDT') {
      if (network === 'ERC20') return 'USDT-ERC20';
      if (network === 'TRC20') return 'USDT-TRC20';
      if (network === 'BEP20') return 'USDT-BEP20';
    }
    if (coin === 'BTC') return 'BTC';
    return 'ETH';
  },
  /** Pretty label for any network value (deposit-side or withdraw-side). */
  label(network: DepositNetwork | WithdrawNetwork): string {
    if (network === 'USDT-ERC20' || network === 'ERC20')   return 'ERC20';
    if (network === 'USDT-TRC20' || network === 'TRC20')   return 'TRC20';
    if (network === 'USDT-BEP20' || network === 'BEP20')   return 'BEP20';
    if (network === 'BTC' || network === 'Bitcoin')        return 'Bitcoin';
    return 'Ethereum';
  },
} as const;

// ── Records ──
export interface DepositRecord {
  _id: string;
  userId: string;
  amount: number;
  currency: Coin;
  network: DepositNetwork;
  proofFilePath?: string;
  note?: string;
  status: FundsStatus;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  txHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WithdrawalRecord {
  _id: string;
  userId: string;
  amount: number;
  currency: Coin;
  network: WithdrawNetwork;
  toAddress: string;
  networkFee: number;
  netAmount: number;
  status: FundsStatus;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  txHash?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Address book + fees ──
export type DepositAddresses = Record<WithdrawNetwork, string>;

export interface DepositAddressesResponse {
  addresses: DepositAddresses;
  updatedAt: string | null;
}

export type NetworkFees = Record<WithdrawNetwork, number | null>;

export interface NetworkFeesResponse {
  fees: NetworkFees;
}

// ── Balance ──
export interface BalanceResponse {
  balance: number;
  currency: 'USDT';
  isFrozen: boolean;
}

// ── Submit payloads ──
export interface SubmitDepositInput {
  amount: number;
  currency: Coin;
  network: DepositNetwork;
  note?: string;
  proof?: File;
}

export interface SubmitDepositResponse {
  message: string;
  deposit: DepositRecord;
}

export interface SubmitWithdrawInput {
  amount: number;
  currency: Coin;
  network: WithdrawNetwork;
  toAddress: string;
  note?: string;
}

export interface SubmitWithdrawResponse {
  message: string;
  withdrawal: WithdrawalRecord;
  newBalance: number;
}

export interface DepositsListResponse {
  deposits: DepositRecord[];
  total: number;
}

export interface WithdrawalsListResponse {
  withdrawals: WithdrawalRecord[];
  total: number;
}

export interface UpdateFeeResponse {
  message: string;
  network: WithdrawNetwork;
  fee: number;
  updatedAt: string;
}