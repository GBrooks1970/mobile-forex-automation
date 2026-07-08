// P&L engine (MF-02). Pure functions implementing the PRS math with integer
// arithmetic throughout — see docs/design-document.md §5.1 and the PRS
// "Pip Difference / Gross P&L / Net P&L" specifications.
//
// Integer scheme (see types.ts): prices in points, lots in hundredths,
// money in cents/pence. The one worked oracle from the PRS:
//   GBP/USD BUY 0.50 lots, 1.25000 -> 1.25620, R = 1.25620
//   => 62.0 pips, +$310.00 quote, +£246.78 gross.

import {
  POINTS_PER_PIP,
  type TradeDirection,
  isJpyQuoted,
} from './types.js';

/** Round-half-away-from-zero for signed integer division (a / b). */
function divRound(a: number, b: number): number {
  if (b === 0) throw new Error('divRound: division by zero');
  const sign = Math.sign(a) * Math.sign(b) || 1;
  const abs = Math.abs(a);
  const babs = Math.abs(b);
  return sign * Math.floor((abs + babs / 2) / babs);
}

/** Directional price difference in points (positive = in the trader's favour). */
export function directionalDiffPts(
  direction: TradeDirection,
  entryPricePts: number,
  exitPricePts: number,
): number {
  return direction === 'BUY'
    ? exitPricePts - entryPricePts
    : entryPricePts - exitPricePts;
}

/**
 * Pip difference to 1 decimal place (pips are 10 points).
 * Returned as a number carrying at most one decimal (e.g. 62.0, -3.5).
 */
export function pipDifference(
  direction: TradeDirection,
  entryPricePts: number,
  exitPricePts: number,
): number {
  const diffPts = directionalDiffPts(direction, entryPricePts, exitPricePts);
  return diffPts / POINTS_PER_PIP;
}

/**
 * Gross P&L in QUOTE-currency cents.
 *
 * Derivation (non-JPY): priceDiff × lots × 100,000
 *   = (diffPts × 1e-5) × (lots2 / 100) × 1e5 quote units
 *   = diffPts × lots2 × 0.01 quote units  = diffPts × lots2 quote CENTS — exact.
 * JPY quotes (3-decimal points, 2-decimal cash): diffPts × lots2 × 10 sen — exact.
 */
export function grossPnlQuoteCents(
  pair: string,
  direction: TradeDirection,
  volumeLots2: number,
  entryPricePts: number,
  exitPricePts: number,
): number {
  const diffPts = directionalDiffPts(direction, entryPricePts, exitPricePts);
  const perCent = isJpyQuoted(pair) ? 10 : 1;
  return diffPts * volumeLots2 * perCent;
}

/**
 * Convert quote-currency cents to GBP pence at closure rate R.
 *
 * R is supplied in points of the GBP/<quote> price (e.g. GBP/USD 1.25620 ->
 * 125620). Per the PRS: P&L_GBP = P&L_quote / R; when the quote currency is
 * already GBP, pass `null` (R = 1).
 */
export function quoteCentsToGbpPence(
  quoteCents: number,
  gbpQuoteRatePts: number | null,
): number {
  if (gbpQuoteRatePts === null) return quoteCents;
  if (gbpQuoteRatePts <= 0) throw new Error('conversion rate must be positive');
  // pence = cents / (ratePts / 1e5) = cents * 1e5 / ratePts, rounded.
  return divRound(quoteCents * 100_000, gbpQuoteRatePts);
}

/** Gross P&L in GBP pence (compose the two steps above). */
export function grossPnlGbpPence(
  pair: string,
  direction: TradeDirection,
  volumeLots2: number,
  entryPricePts: number,
  exitPricePts: number,
  gbpQuoteRatePts: number | null,
): number {
  return quoteCentsToGbpPence(
    grossPnlQuoteCents(pair, direction, volumeLots2, entryPricePts, exitPricePts),
    gbpQuoteRatePts,
  );
}

/** Broker commission config (PRS example: £2.50 per lot per side). */
export const COMMISSION_PENCE_PER_LOT_PER_SIDE = 250;

/**
 * Total commission in pence: 2 sides × rate × lots.
 * PRS oracle: 0.50 lots -> 2 × £2.50 × 0.50 = £2.50 (250 pence).
 */
export function commissionPence(volumeLots2: number): number {
  // 2 * 250 * (lots2/100) = 5 * lots2 — exact for integer lots2.
  return divRound(2 * COMMISSION_PENCE_PER_LOT_PER_SIDE * volumeLots2, 100);
}

/** Swap rate in points per night (PRS default: BUY pays 0.5, SELL earns 0.1). */
export function defaultSwapRatePoints(direction: TradeDirection): number {
  return direction === 'BUY' ? -0.5 : 0.1;
}

/**
 * Chargeable swap nights: nights held, +2 when a Wednesday 22:00 UTC rollover
 * was crossed (triple-swap Wednesday, per the PRS).
 */
export function swapDaysChargeable(nightsHeld: number, crossedWednesday: boolean): number {
  if (nightsHeld < 0) throw new Error('nightsHeld must be >= 0');
  if (nightsHeld === 0) return 0; // closed same day: no rollover, no triple charge
  return nightsHeld + (crossedWednesday ? 2 : 0);
}

/**
 * Accumulated swap in QUOTE cents (signed; credit positive).
 *
 * PRS: lots × 100,000 × ratePoints × pointSize, per chargeable day.
 * Non-JPY: (lots2×1000) × rate × 1e-5 × 100 cents = lots2 × rate cents/day.
 * JPY:     (lots2×1000) × rate × 1e-3 × 100 sen  = lots2 × rate × 100 sen/day.
 */
export function swapQuoteCents(
  pair: string,
  direction: TradeDirection,
  volumeLots2: number,
  nightsHeld: number,
  crossedWednesday: boolean,
): number {
  const days = swapDaysChargeable(nightsHeld, crossedWednesday);
  if (days === 0) return 0; // avoid a -0 artefact from rate * 0
  const rate = defaultSwapRatePoints(direction);
  const perDayCents = volumeLots2 * rate * (isJpyQuoted(pair) ? 100 : 1);
  return Math.round(perDayCents * days); // rate has 1dp; product is exact to <1 cent
}

/** Net P&L in GBP pence: gross − commission ± swap (PRS Net P&L formula). */
export function netPnlGbpPence(args: {
  pair: string;
  direction: TradeDirection;
  volumeLots2: number;
  entryPricePts: number;
  exitPricePts: number;
  gbpQuoteRatePts: number | null;
  nightsHeld: number;
  crossedWednesday: boolean;
}): {
  grossPnlPence: number;
  commissionPence: number;
  swapPence: number;
  netPnlPence: number;
} {
  const gross = grossPnlGbpPence(
    args.pair,
    args.direction,
    args.volumeLots2,
    args.entryPricePts,
    args.exitPricePts,
    args.gbpQuoteRatePts,
  );
  const commission = commissionPence(args.volumeLots2);
  const swapQuote = swapQuoteCents(
    args.pair,
    args.direction,
    args.volumeLots2,
    args.nightsHeld,
    args.crossedWednesday,
  );
  const swap = quoteCentsToGbpPence(swapQuote, args.gbpQuoteRatePts);
  return {
    grossPnlPence: gross,
    commissionPence: commission,
    swapPence: swap,
    netPnlPence: gross - commission + swap,
  };
}
