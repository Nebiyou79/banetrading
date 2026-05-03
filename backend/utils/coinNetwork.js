// utils/coinNetwork.js
// ── Coin / network validation helpers ──
//
// BALANCE FIX:
// Network enum unified to match frontend DepositNetwork / WithdrawNetwork types:
//   'USDT-ERC20', 'USDT-TRC20', 'USDT-BEP20', 'BTC', 'ETH'
//
// Previously backend used: 'ERC20', 'TRC20', 'BEP20', 'Bitcoin', 'Ethereum'
// Both Deposit.network and Withdrawal.network models are updated to use
// the unified values, so no mapping transform is needed.

// ── All networks that accept deposits ──
const ALL_DEPOSIT_NETWORKS = ['USDT-ERC20', 'USDT-TRC20', 'USDT-BEP20', 'BTC', 'ETH'];

// ── All networks that accept withdrawals (same set) ──
const ALL_WITHDRAW_NETWORKS = ['USDT-ERC20', 'USDT-TRC20', 'USDT-BEP20', 'BTC', 'ETH'];

// ── Valid (currency, network) combinations for deposits ──
const VALID_DEPOSIT_COMBOS = {
  USDT: ['USDT-ERC20', 'USDT-TRC20', 'USDT-BEP20'],
  BTC:  ['BTC'],
  ETH:  ['ETH'],
};

// ── Valid (currency, network) combinations for withdrawals ──
const VALID_WITHDRAW_COMBOS = {
  USDT: ['USDT-ERC20', 'USDT-TRC20', 'USDT-BEP20'],
  BTC:  ['BTC'],
  ETH:  ['ETH'],
};

/**
 * Returns true if the (currency, network) pair is valid for deposits.
 * @param {string} currency  e.g. 'USDT'
 * @param {string} network   e.g. 'USDT-ERC20'
 */
function isValidDepositCombo(currency, network) {
  const allowed = VALID_DEPOSIT_COMBOS[currency?.toUpperCase()];
  return Array.isArray(allowed) && allowed.includes(network);
}

/**
 * Returns true if the (currency, network) pair is valid for withdrawals.
 * @param {string} currency  e.g. 'USDT'
 * @param {string} network   e.g. 'USDT-TRC20'
 */
function isValidWithdrawCombo(currency, network) {
  const allowed = VALID_WITHDRAW_COMBOS[currency?.toUpperCase()];
  return Array.isArray(allowed) && allowed.includes(network);
}

module.exports = {
  ALL_DEPOSIT_NETWORKS,
  ALL_WITHDRAW_NETWORKS,
  VALID_DEPOSIT_COMBOS,
  VALID_WITHDRAW_COMBOS,
  isValidDepositCombo,
  isValidWithdrawCombo,
};