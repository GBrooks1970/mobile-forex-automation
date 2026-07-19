// Shared test-support helpers for turning displayed strings back into the
// integer domain values the core works in (MF review TRIAGE-02).
//
// Every price-parsing test previously reimplemented its own `toPts`, hard-coded
// to a 5-decimal scale factor regardless of pair. That is correct for every
// current journey (all trade GBP/USD), but wrong for a JPY-quoted pair
// (3 decimals, src/core/types.ts `pointDecimals`) -- the first test that
// exercises USD/JPY would silently get prices off by x100.

import { pointDecimals, type CurrencyPair } from '../../src/core/types.js';

/**
 * Displayed price string ("1.25000", "155.123") -> integer points, pair-aware.
 * The exact inverse of `src/core/format.ts`'s `formatPricePts`. Uses
 * `pointDecimals(pair)` and integer string arithmetic (split on the decimal
 * point, combine as integers) rather than `parseFloat`, which would round-trip
 * through binary floating point and does not know the pair's decimal-place
 * convention at all.
 */
export function parsePricePts(pair: CurrencyPair, text: string): number {
  const trimmed = text.trim();
  const negative = trimmed.startsWith('-');
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const dp = pointDecimals(pair);
  const [wholePart = '0', fracPart = ''] = unsigned.split('.');
  const frac = fracPart.padEnd(dp, '0').slice(0, dp);
  const magnitude = Number(wholePart) * 10 ** dp + Number(frac === '' ? '0' : frac);
  return negative ? -magnitude : magnitude;
}

/** Signed pence -> "£-1,234.56" style GBP string (mirrors `formatGbpPence`). */
export function gbp(pence: number): string {
  const sign = pence < 0 ? '-' : '';
  const abs = Math.abs(pence);
  return `${sign}£${(abs / 100).toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
