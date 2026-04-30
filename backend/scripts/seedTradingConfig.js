// scripts/seedTradingConfig.js
// ── ENSURE DEFAULT TRADING CONFIG EXISTS ──
// Plans: SILVER(+12%, 30s, $50min) | GOLD(+18%, 60s, $10000min)
//        PLATINUM(+25%, 90s, $40000min) | DIAMOND(+32%, 120s, $90000min)
//        ELITE(+45%, 150s, $130000min)
// feeBps: 200 (2% of profit only)
// enabledPairs: [] (all pairs allowed)

const TradingConfig = require('../models/TradingConfig');

const DEFAULT_PLANS = [
  { key: 'SILVER',   multiplier: 0.12, durationSec: 30,  minUsd: 50,     active: true },
  { key: 'GOLD',     multiplier: 0.18, durationSec: 60,  minUsd: 10000,  active: true },
  { key: 'PLATINUM', multiplier: 0.25, durationSec: 90,  minUsd: 40000,  active: true },
  { key: 'DIAMOND',  multiplier: 0.32, durationSec: 120, minUsd: 90000,  active: true },
  { key: 'ELITE',    multiplier: 0.45, durationSec: 150, minUsd: 130000, active: true },
];

async function seedTradingConfig() {
  const existing = await TradingConfig.findOne();
  if (!existing) {
    await TradingConfig.create({
      plans: DEFAULT_PLANS,
      feeBps: 200,
      enabledPairs: [],
    });
    console.log('[seedTradingConfig] Default trading config created (5 plans, feeBps=200)');
  }
}

module.exports = seedTradingConfig;