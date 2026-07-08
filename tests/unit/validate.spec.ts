import { describe, expect, it } from 'vitest';
import { validateClose, validateOpen, type OpenOrderInput } from '../../src/core/validate.js';

const validBuy: OpenOrderInput = {
  currencyPair: 'GBP/USD',
  tradeDirection: 'BUY',
  volumeLots2: 50,
  entryPricePts: 125_000,
  stopLossPts: 124_500,
  takeProfitPts: 125_800,
};

function rules(violations: { rule: string }[]): string[] {
  return violations.map((v) => v.rule).sort();
}

describe('validateOpen (PRS integrity rules)', () => {
  it('accepts a well-formed BUY with SL below and TP above entry', () => {
    expect(validateOpen(validBuy)).toEqual([]);
  });

  it('accepts null SL/TP (both optional)', () => {
    expect(validateOpen({ ...validBuy, stopLossPts: null, takeProfitPts: null })).toEqual([]);
  });

  it('rejects zero and negative volume', () => {
    expect(rules(validateOpen({ ...validBuy, volumeLots2: 0 }))).toContain('volume-positive');
    expect(rules(validateOpen({ ...validBuy, volumeLots2: -10 }))).toContain('volume-positive');
  });

  it('rejects an unknown pair', () => {
    expect(rules(validateOpen({ ...validBuy, currencyPair: 'XAU/USD' }))).toContain('pair-known');
  });

  it('BUY: rejects TP at/below entry and SL at/above entry (boundary = entry itself)', () => {
    expect(rules(validateOpen({ ...validBuy, takeProfitPts: 125_000 }))).toContain('tp-side');
    expect(rules(validateOpen({ ...validBuy, stopLossPts: 125_000 }))).toContain('sl-side');
  });

  it('SELL: enforces the strict inverse', () => {
    const sell: OpenOrderInput = {
      ...validBuy,
      tradeDirection: 'SELL',
      stopLossPts: 125_800,
      takeProfitPts: 124_500,
    };
    expect(validateOpen(sell)).toEqual([]);
    expect(rules(validateOpen({ ...sell, takeProfitPts: 124_900 }))).toEqual([]); // genuinely below entry
    expect(rules(validateOpen({ ...sell, takeProfitPts: 125_000 }))).toContain('tp-side'); // equal = rejected (strict)
    expect(rules(validateOpen({ ...sell, takeProfitPts: 125_800 }))).toContain('tp-side');
    expect(rules(validateOpen({ ...sell, stopLossPts: 124_000 }))).toContain('sl-side');
  });
});

describe('validateClose', () => {
  it('accepts closed_at equal to opened_at (boundary is inclusive)', () => {
    expect(validateClose({ openedAtMs: 1_000 }, 125_100, 1_000)).toEqual([]);
  });

  it('rejects closed_at before opened_at', () => {
    expect(rules(validateClose({ openedAtMs: 1_000 }, 125_100, 999))).toContain(
      'closed-after-opened',
    );
  });

  it('rejects a non-positive exit price', () => {
    expect(rules(validateClose({ openedAtMs: 0 }, 0, 1))).toContain('exit-positive');
  });
});
