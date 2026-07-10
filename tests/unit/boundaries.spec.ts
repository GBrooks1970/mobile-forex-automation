import { describe, expect, it } from 'vitest';
import {
  commissionPence,
  grossPnlQuoteCents,
  pipDifference,
  quoteCentsToGbpPence,
  swapQuoteCents,
} from '../../src/core/pnl.js';
import { validateClose, validateOpen, type OpenOrderInput } from '../../src/core/validate.js';

// MF-09: ISTQB-style boundary-value + equivalence-partition sweep over the pure
// core, complementing the PRS oracle in pnl.spec.ts / validate.spec.ts.

describe('gross P&L — quote-currency conventions', () => {
  it('is zero when the price is unchanged', () => {
    expect(grossPnlQuoteCents('GBP/USD', 'BUY', 50, 125_000, 125_000)).toBe(0);
  });

  it('non-JPY: quote cents == diffPts * lots2 (the exact identity)', () => {
    // 1 point on 0.10 lots = 10 cents; 620 points on 0.50 lots = 31000 cents ($310).
    expect(grossPnlQuoteCents('GBP/USD', 'BUY', 10, 125_000, 125_001)).toBe(10);
    expect(grossPnlQuoteCents('GBP/USD', 'BUY', 50, 125_000, 125_620)).toBe(31_000);
  });

  it('JPY: 0.10-lot move of 10 pips (100 points) is ¥1000 = 100000 sen', () => {
    // USD/JPY BUY 0.10 lots, 155.000 -> 155.100.
    // PRS: 0.100 price x 0.10 lots x 100000 = ¥1000.00 -> 100000 sen.
    expect(grossPnlQuoteCents('USD/JPY', 'BUY', 10, 155_000, 155_100)).toBe(100_000);
  });
});

describe('quote -> GBP rounding (half away from zero)', () => {
  it('rounds an exact half away from zero, symmetrically', () => {
    expect(quoteCentsToGbpPence(1, 200_000)).toBe(1); //  0.5 -> 1
    expect(quoteCentsToGbpPence(-1, 200_000)).toBe(-1); // -0.5 -> -1
  });

  it('rounds just-below-half toward zero and just-above-half away', () => {
    expect(quoteCentsToGbpPence(1, 250_000)).toBe(0); // 0.4 -> 0
    expect(quoteCentsToGbpPence(3, 500_000)).toBe(1); // 0.6 -> 1
    expect(quoteCentsToGbpPence(-3, 500_000)).toBe(-1); // -0.6 -> -1
  });
});

describe('commission boundaries (5 pence per lot2)', () => {
  it('scales linearly from the smallest lot', () => {
    expect(commissionPence(1)).toBe(5); // 0.01 lots
    expect(commissionPence(10)).toBe(50); // 0.10 lots
    expect(commissionPence(250)).toBe(1_250); // 2.50 lots
  });
});

describe('swap boundaries', () => {
  it('accumulates per night and triples across a Wednesday', () => {
    // non-JPY BUY 0.10 lots: perDay = 10 * -0.5 = -5 cents.
    expect(swapQuoteCents('GBP/USD', 'BUY', 10, 3, false)).toBe(-15);
    expect(swapQuoteCents('GBP/USD', 'BUY', 10, 3, true)).toBe(-25); // 3 + 2 days
  });

  it('credits a SELL and exercises the JPY branch', () => {
    expect(swapQuoteCents('GBP/USD', 'SELL', 10, 1, false)).toBe(1); // 10 * 0.1
    expect(swapQuoteCents('USD/JPY', 'BUY', 10, 1, false)).toBe(-500); // 10 * -0.5 * 100
  });
});

describe('pip boundaries', () => {
  it('resolves a single point to 0.1 pip and the JPY convention', () => {
    expect(pipDifference('BUY', 125_000, 125_001)).toBe(0.1);
    expect(pipDifference('BUY', 155_000, 155_010)).toBe(1.0); // JPY: 10 points = 1 pip
  });
});

// ---- validation boundary tables ------------------------------------------

const baseBuy: OpenOrderInput = {
  currencyPair: 'GBP/USD',
  tradeDirection: 'BUY',
  volumeLots2: 10,
  entryPricePts: 125_000,
  stopLossPts: null,
  takeProfitPts: null,
};

describe('validateOpen — volume boundary', () => {
  it.each([
    [-1, false],
    [0, false],
    [1, true],
    [10, true],
  ])('volume2 %d -> valid=%s', (volumeLots2, valid) => {
    const ok = validateOpen({ ...baseBuy, volumeLots2 }).length === 0;
    expect(ok).toBe(valid);
  });
});

describe('validateOpen — SL/TP on the entry boundary (strict)', () => {
  it.each([
    ['BUY', 'takeProfitPts', 124_999, false], // TP below entry -> invalid
    ['BUY', 'takeProfitPts', 125_000, false], // TP == entry     -> invalid (strict)
    ['BUY', 'takeProfitPts', 125_001, true], //  TP above entry  -> valid
    ['BUY', 'stopLossPts', 125_001, false], //   SL above entry  -> invalid
    ['BUY', 'stopLossPts', 125_000, false], //   SL == entry     -> invalid
    ['BUY', 'stopLossPts', 124_999, true], //    SL below entry  -> valid
  ] as const)('%s %s=%d -> valid=%s', (dir, field, value, valid) => {
    const input: OpenOrderInput = { ...baseBuy, tradeDirection: dir, [field]: value };
    expect(validateOpen(input).length === 0).toBe(valid);
  });
});

describe('validateClose — timestamp and exit-price boundaries', () => {
  const opened = { openedAtMs: 1_000 };
  it.each([
    [999, false], // before open -> invalid
    [1_000, true], // exactly at open -> valid (inclusive)
    [1_001, true], // after open -> valid
  ])('closedAt %d -> valid=%s', (closedAtMs, valid) => {
    expect(validateClose(opened, 125_100, closedAtMs).length === 0).toBe(valid);
  });

  it.each([
    [0, false],
    [1, true],
  ])('exitPts %d -> valid=%s', (exitPricePts, valid) => {
    expect(validateClose(opened, exitPricePts, 2_000).length === 0).toBe(valid);
  });
});
