// lib/tradePnl.ts
// ── TRADE P&L CALCULATIONS — SINGLE SOURCE OF TRUTH ──
//
// Correct model:
//   risk      = stake × multiplier          (amount at risk, e.g. 100 × 0.12 = 12 USDT)
//   fee       = risk × feeRate              (fee on the risk amount only)
//
//   WIN:  netGain     = risk - fee          (e.g. 12 - 0.24 = 11.76)
//         credited    = stake + netGain     (e.g. 100 + 11.76 = 111.76)
//
//   LOSS: totalLoss   = risk + fee          (e.g. 12 + 0.24 = 12.24)
//         credited    = stake - totalLoss   (e.g. 100 - 12.24 = 87.76)

export interface TradePnl {
  stake:        number;
  multiplier:   number;
  feeRate:      number;
  feePct:       string;   // "2.00"
  risk:         number;   // stake × multiplier
  fee:          number;   // risk × feeRate

  // Win scenario
  netGain:      number;   // risk - fee
  winCredited:  number;   // stake + netGain

  // Loss scenario
  totalLoss:    number;   // risk + fee
  lossCredited: number;   // stake - totalLoss

  // Display helpers
  multiplierDisplay: string; // "1.12x"
}

export function calcPnl(
  stake: number,
  multiplier: number,
  feeBps: number,
): TradePnl {
  const feeRate  = feeBps / 10_000;
  const feePct   = (feeBps / 100).toFixed(2);
  const risk     = stake * multiplier;
  const fee      = risk * feeRate;

  const netGain      = risk - fee;
  const winCredited  = stake + netGain;

  const totalLoss    = risk + fee;
  const lossCredited = Math.max(0, stake - totalLoss);

  return {
    stake,
    multiplier,
    feeRate,
    feePct,
    risk,
    fee,
    netGain,
    winCredited,
    totalLoss,
    lossCredited,
    multiplierDisplay: `${(1 + multiplier).toFixed(2)}x`,
  };
}