// config/coins.js
// ── COIN UNIVERSE + METADATA ──
// Symbol → { id (CoinGecko), binanceSymbol, name, iconUrl, color }
// Tier-1 coins are always included; Tier-2 added from primary API response if found

const TIER_1 = [
  { symbol: 'BTC',   id: 'bitcoin',     binanceSymbol: 'BTCUSDT',  name: 'Bitcoin',     color: '#F7931A' },
  { symbol: 'ETH',   id: 'ethereum',    binanceSymbol: 'ETHUSDT',  name: 'Ethereum',    color: '#627EEA' },
  { symbol: 'USDT',  id: 'tether',      binanceSymbol: null,       name: 'Tether',      color: '#26A17B' },
  { symbol: 'BNB',   id: 'binancecoin', binanceSymbol: 'BNBUSDT',  name: 'BNB',         color: '#F3BA2F' },
  { symbol: 'SOL',   id: 'solana',      binanceSymbol: 'SOLUSDT',  name: 'Solana',      color: '#9945FF' },
  { symbol: 'XRP',   id: 'ripple',      binanceSymbol: 'XRPUSDT',  name: 'XRP',         color: '#23292F' },
  { symbol: 'ADA',   id: 'cardano',     binanceSymbol: 'ADAUSDT',  name: 'Cardano',     color: '#0033AD' },
  { symbol: 'DOGE',  id: 'dogecoin',    binanceSymbol: 'DOGEUSDT', name: 'Dogecoin',    color: '#C2A633' },
  { symbol: 'TRX',   id: 'tron',        binanceSymbol: 'TRXUSDT',  name: 'TRON',        color: '#FF0013' },
  { symbol: 'MATIC', id: 'polygon-pos', binanceSymbol: 'MATICUSDT',name: 'Polygon',     color: '#8247E5' },
  { symbol: 'DOT',   id: 'polkadot',    binanceSymbol: 'DOTUSDT',  name: 'Polkadot',    color: '#E6007A' },
  { symbol: 'LTC',   id: 'litecoin',    binanceSymbol: 'LTCUSDT',  name: 'Litecoin',    color: '#345D9D' },
  { symbol: 'AVAX',  id: 'avalanche-2', binanceSymbol: 'AVAXUSDT', name: 'Avalanche',   color: '#E84142' },
  { symbol: 'LINK',  id: 'chainlink',   binanceSymbol: 'LINKUSDT', name: 'Chainlink',   color: '#2A5ADA' },
  { symbol: 'BCH',   id: 'bitcoin-cash',binanceSymbol: 'BCHUSDT',  name: 'Bitcoin Cash',color: '#0AC18E' },
];

// ── Build lookup maps for fast access ──
const BY_SYMBOL = Object.fromEntries(TIER_1.map(c => [c.symbol, c]));
const BY_GECKO_ID = Object.fromEntries(TIER_1.map(c => [c.id, c]));
const BY_BINANCE = Object.fromEntries(TIER_1.filter(c => c.binanceSymbol).map(c => [c.binanceSymbol, c]));

module.exports = { TIER_1, BY_SYMBOL, BY_GECKO_ID, BY_BINANCE };