// types/history.ts
// ── HISTORY MODULE TYPES ──

export type HistoryItemType = 'trade' | 'deposit' | 'withdrawal' | 'conversion';

interface BaseHistoryItem {
  id: string;
  type: HistoryItemType;
  createdAt: string;
  status: string;
}

export interface TradeHistoryItem extends BaseHistoryItem {
  type: 'trade';
  pair: string;
  amount: number;
  plan: string;
  duration: number;
  result: number;
}

export interface DepositHistoryItem extends BaseHistoryItem {
  type: 'deposit';
  currency: string;
  network: string;
  amount: number;
}

export interface WithdrawalHistoryItem extends BaseHistoryItem {
  type: 'withdrawal';
  currency: string;
  network: string;
  amount: number;
  address: string;
}

export interface ConversionHistoryItem extends BaseHistoryItem {
  type: 'conversion';
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
}

export type HistoryItem = TradeHistoryItem | DepositHistoryItem | WithdrawalHistoryItem | ConversionHistoryItem;

export interface HistoryQueryParams {
  type?: HistoryItemType | 'all';
  limit?: number;
  offset?: number;
  status?: string;
  from?: string;
  to?: string;
}

export interface HistoryResponse {
  items: HistoryItem[];
  total: number;
  hasMore: boolean;
}