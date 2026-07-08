// Core domain types (MF-02). Pure — no DOM, no I/O, no Date.now().
//
// Money and prices are INTEGERS throughout (PRS rule: never floats for money):
//   - prices   : integer "points", the pair's smallest increment
//                (0.00001 for most pairs -> 1.25000 is 125000pt;
//                 0.001 for JPY quotes   -> 155.123 is 155123pt)
//   - lots     : integer hundredths of a lot ("lots2", 0.50 lots -> 50)
//   - money    : integer cents/pence of the relevant currency
// Formatting to decimal strings happens only at the UI edge.

export const MVP_PAIRS = [
  'GBP/USD',
  'EUR/USD',
  'USD/JPY',
  'AUD/USD',
  'USD/CAD',
] as const;

export type CurrencyPair = (typeof MVP_PAIRS)[number];

export type TradeDirection = 'BUY' | 'SELL';

export type CloseReason = 'MANUAL' | 'STOP_LOSS' | 'TAKE_PROFIT';

/** True for pairs quoted in JPY (2/3-decimal convention). */
export function isJpyQuoted(pair: string): boolean {
  return pair.endsWith('/JPY');
}

/** Decimal places of the pair's point (smallest increment). */
export function pointDecimals(pair: string): number {
  return isJpyQuoted(pair) ? 3 : 5;
}

/** Points per pip: a pip is the 4th decimal (2nd for JPY) = 10 points. */
export const POINTS_PER_PIP = 10;

/** One standard lot = 100,000 units of the base currency. */
export const UNITS_PER_LOT = 100_000;

/** An open position (PRS `open_trades` shape, integer representation). */
export interface OpenTrade {
  tradeId: string;
  userId: string;
  currencyPair: CurrencyPair;
  tradeDirection: TradeDirection;
  /** hundredths of a lot; must be > 0 */
  volumeLots2: number;
  /** integer points */
  entryPricePts: number;
  /** integer points, updated on tick */
  currentPricePts: number;
  /** integer points or null */
  stopLossPts: number | null;
  /** integer points or null */
  takeProfitPts: number | null;
  /** epoch milliseconds (injected clock, never Date.now() in the core) */
  openedAtMs: number;
}

/** An immutable closed-trade record (PRS `trade_history` shape). */
export interface TradeHistoryRow {
  historyId: string;
  tradeId: string;
  userId: string;
  currencyPair: CurrencyPair;
  tradeDirection: TradeDirection;
  volumeLots2: number;
  entryPricePts: number;
  exitPricePts: number;
  closeReason: CloseReason;
  /** pence (GBP cents), signed */
  grossPnlPence: number;
  /** pence, signed */
  netPnlPence: number;
  /** pence, always >= 0 */
  commissionPence: number;
  /** pence, signed (credit positive) */
  swapPence: number;
  openedAtMs: number;
  closedAtMs: number;
}
