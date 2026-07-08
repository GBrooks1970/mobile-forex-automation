import { describe, expect, it } from 'vitest';
import {
  commissionPence,
  grossPnlGbpPence,
  grossPnlQuoteCents,
  netPnlGbpPence,
  pipDifference,
  quoteCentsToGbpPence,
  swapDaysChargeable,
  swapQuoteCents,
} from '../../src/core/pnl.js';
import { formatGbpPence, formatLots2, formatPricePts } from '../../src/core/format.js';

// ---------------------------------------------------------------------------
// THE PRS ORACLE — the worked example from the spec, pinned exactly:
//   GBP/USD, BUY, 0.50 lots, entry 1.25000, exit 1.25620, R = 1.25620
//   => 62.0 pips ; +$310.00 quote ; +£246.78 gross GBP.
// Integer representation: prices in points (1e-5), lots2 = 50, R = 125620.
// ---------------------------------------------------------------------------
describe('PRS worked example (the oracle)', () => {
  const entry = 125_000;
  const exit = 125_620;
  const rate = 125_620;

  it('yields 62.0 pips', () => {
    expect(pipDifference('BUY', entry, exit)).toBe(62.0);
  });

  it('yields +$310.00 in quote cents', () => {
    expect(grossPnlQuoteCents('GBP/USD', 'BUY', 50, entry, exit)).toBe(31_000);
  });

  it('converts to +£246.78 gross', () => {
    expect(grossPnlGbpPence('GBP/USD', 'BUY', 50, entry, exit, rate)).toBe(24_678);
  });

  it('charges £2.50 total commission on 0.50 lots (PRS commission example)', () => {
    expect(commissionPence(50)).toBe(250);
  });
});

describe('pipDifference', () => {
  it('is directional: SELL profits when price falls', () => {
    expect(pipDifference('SELL', 125_620, 125_000)).toBe(62.0);
    expect(pipDifference('SELL', 125_000, 125_620)).toBe(-62.0);
  });

  it('uses the JPY 2-decimal pip convention via 3-decimal points', () => {
    // USD/JPY 155.000 -> 155.100 = 10.0 pips (points are the 3rd decimal).
    expect(pipDifference('BUY', 155_000, 155_100)).toBe(10.0);
  });
});

describe('quote -> GBP conversion', () => {
  it('is identity when the quote currency is already GBP (R = null)', () => {
    expect(quoteCentsToGbpPence(12_345, null)).toBe(12_345);
  });

  it('rounds half away from zero symmetrically', () => {
    // 100 cents at R=3.00000 -> 33.33.. pence -> 33
    expect(quoteCentsToGbpPence(100, 300_000)).toBe(33);
    expect(quoteCentsToGbpPence(-100, 300_000)).toBe(-33);
    // 150 cents at R=1.00000... use 1.5 pence boundary: 3 cents at R=2 -> 1.5 -> 2
    expect(quoteCentsToGbpPence(3, 200_000)).toBe(2);
    expect(quoteCentsToGbpPence(-3, 200_000)).toBe(-2);
  });

  it('rejects a non-positive rate', () => {
    expect(() => quoteCentsToGbpPence(100, 0)).toThrow();
  });
});

describe('swap', () => {
  it('charges nothing on a same-day close', () => {
    expect(swapDaysChargeable(0, true)).toBe(0);
    expect(swapQuoteCents('GBP/USD', 'BUY', 50, 0, true)).toBe(0);
  });

  it('adds two extra chargeable days across a Wednesday rollover (triple swap)', () => {
    expect(swapDaysChargeable(1, false)).toBe(1);
    expect(swapDaysChargeable(1, true)).toBe(3);
    expect(swapDaysChargeable(5, true)).toBe(7);
  });

  it('debits BUY and credits SELL per the PRS default rates', () => {
    // 0.50 lots, 1 night, non-JPY: perDay = lots2 x rate cents.
    expect(swapQuoteCents('GBP/USD', 'BUY', 50, 1, false)).toBe(-25); // 50 x -0.5
    expect(swapQuoteCents('GBP/USD', 'SELL', 50, 1, false)).toBe(5); //  50 x  0.1
  });

  it('rejects negative nights', () => {
    expect(() => swapDaysChargeable(-1, false)).toThrow();
  });
});

describe('netPnlGbpPence (gross - commission +/- swap)', () => {
  it('composes the PRS oracle with commission and one night of swap', () => {
    const result = netPnlGbpPence({
      pair: 'GBP/USD',
      direction: 'BUY',
      volumeLots2: 50,
      entryPricePts: 125_000,
      exitPricePts: 125_620,
      gbpQuoteRatePts: 125_620,
      nightsHeld: 1,
      crossedWednesday: false,
    });
    expect(result.grossPnlPence).toBe(24_678); // +£246.78
    expect(result.commissionPence).toBe(250); //  £2.50
    expect(result.swapPence).toBe(-20); // -25 quote cents / 1.25620 -> -19.9 -> -20
    expect(result.netPnlPence).toBe(24_678 - 250 - 20); // £244.08
  });
});

describe('formatting at the edge', () => {
  it('renders prices at the pair precision', () => {
    expect(formatPricePts('GBP/USD', 125_000)).toBe('1.25000');
    expect(formatPricePts('USD/JPY', 155_123)).toBe('155.123');
  });

  it('renders pence as GBP', () => {
    expect(formatGbpPence(24_678)).toBe('£246.78');
    expect(formatGbpPence(-45)).toBe('-£0.45');
    expect(formatGbpPence(1_000_000)).toBe('£10,000.00');
  });

  it('renders lots2 as decimal lots', () => {
    expect(formatLots2(50)).toBe('0.50');
    expect(formatLots2(125)).toBe('1.25');
  });
});
