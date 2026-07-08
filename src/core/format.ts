// Formatting at the edge (MF-02): the ONLY place integers become decimal
// strings. Core maths never round-trips through these.

import { pointDecimals } from './types.js';

/** Integer points -> canonical price string ("125000" -> "1.25000"). */
export function formatPricePts(pair: string, pricePts: number): string {
  const dp = pointDecimals(pair);
  const sign = pricePts < 0 ? '-' : '';
  const abs = Math.abs(pricePts);
  const scale = 10 ** dp;
  const whole = Math.floor(abs / scale);
  const frac = String(abs % scale).padStart(dp, '0');
  return `${sign}${whole}.${frac}`;
}

/** Signed pence -> "£-1,234.56" style GBP string. */
export function formatGbpPence(pence: number): string {
  const sign = pence < 0 ? '-' : '';
  const abs = Math.abs(pence);
  const pounds = Math.floor(abs / 100);
  const rem = String(abs % 100).padStart(2, '0');
  return `${sign}£${pounds.toLocaleString('en-GB')}.${rem}`;
}

/** Integer hundredths of a lot -> "0.50". */
export function formatLots2(volumeLots2: number): string {
  const sign = volumeLots2 < 0 ? '-' : '';
  const abs = Math.abs(volumeLots2);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}
