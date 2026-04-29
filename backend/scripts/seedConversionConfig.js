// scripts/seedConversionConfig.js
// ── ENSURE DEFAULT CONVERSION CONFIG EXISTS ──

const ConversionConfig = require('../models/ConversionConfig');

async function seedConversionConfig() {
  const existing = await ConversionConfig.findOne();
  if (!existing) {
    await ConversionConfig.create({
      feeBps: 100,
      minConvertUsd: 1,
      enabledPairs: [],
    });
    console.log('[seedConversionConfig] Default conversion config created (feeBps=100)');
  }
}

module.exports = seedConversionConfig;