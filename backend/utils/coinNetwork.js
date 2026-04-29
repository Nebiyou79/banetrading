// utils/coinNetworks.js
// ── Coin ↔ network compatibility matrix ──

// Deposit-side: network names without coin prefix (per the Deposit schema enum).
const DEPOSIT_NETWORKS_FOR_COIN = {
  USDT: ['ERC20', 'TRC20', 'BEP20'],
  BTC:  ['Bitcoin'],
  ETH:  ['Ethereum'],
};

// Withdraw-side: coin-prefixed network keys (per the Withdrawal/NetworkFee enums).
const WITHDRAW_NETWORKS_FOR_COIN = {
  USDT: ['USDT-ERC20', 'USDT-TRC20', 'USDT-BEP20'],
  BTC:  ['BTC'],
  ETH:  ['ETH'],
};

const ALL_DEPOSIT_NETWORKS  = ['ERC20', 'TRC20', 'BEP20', 'Bitcoin', 'Ethereum'];
const ALL_WITHDRAW_NETWORKS = ['USDT-ERC20', 'USDT-TRC20', 'USDT-BEP20', 'BTC', 'ETH'];
const COINS                 = ['USDT', 'BTC', 'ETH'];

/** Map a withdraw-style network back to its deposit-style address-book key. */
function withdrawNetworkToAddressKey(network) {
  // The address book uses the same withdraw-style keys, so this is identity.
  return network;
}

function isValidDepositCombo(currency, network) {
  const allowed = DEPOSIT_NETWORKS_FOR_COIN[currency];
  return Array.isArray(allowed) && allowed.includes(network);
}

function isValidWithdrawCombo(currency, network) {
  const allowed = WITHDRAW_NETWORKS_FOR_COIN[currency];
  return Array.isArray(allowed) && allowed.includes(network);
}

module.exports = {
  COINS,
  DEPOSIT_NETWORKS_FOR_COIN,
  WITHDRAW_NETWORKS_FOR_COIN,
  ALL_DEPOSIT_NETWORKS,
  ALL_WITHDRAW_NETWORKS,
  isValidDepositCombo,
  isValidWithdrawCombo,
  withdrawNetworkToAddressKey,
};