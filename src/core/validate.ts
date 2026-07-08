// Trade validation rules (MF-02) — the PRS "Data Integrity & Validation Rules"
// as pure predicates. Each returns a list of violations (empty = valid), so the
// UI and the tests share one source of truth for what is legal.

import { MVP_PAIRS, type OpenTrade, type TradeDirection } from './types.js';

export interface Violation {
  rule: string;
  message: string;
}

export interface OpenOrderInput {
  currencyPair: string;
  tradeDirection: TradeDirection;
  volumeLots2: number;
  entryPricePts: number;
  stopLossPts: number | null;
  takeProfitPts: number | null;
}

/** PRS rules for opening: pair known; volume > 0; SL/TP on the correct side. */
export function validateOpen(input: OpenOrderInput): Violation[] {
  const violations: Violation[] = [];

  if (!(MVP_PAIRS as readonly string[]).includes(input.currencyPair)) {
    violations.push({
      rule: 'pair-known',
      message: `currency_pair must be one of the MVP pairs (got "${input.currencyPair}")`,
    });
  }

  if (!Number.isInteger(input.volumeLots2) || input.volumeLots2 <= 0) {
    violations.push({
      rule: 'volume-positive',
      message: 'volume_lots must be greater than zero',
    });
  }

  if (!Number.isInteger(input.entryPricePts) || input.entryPricePts <= 0) {
    violations.push({
      rule: 'entry-positive',
      message: 'entry_price must be a positive price',
    });
  }

  const { tradeDirection: dir, entryPricePts: entry, stopLossPts: sl, takeProfitPts: tp } = input;
  if (dir === 'BUY') {
    if (tp !== null && tp <= entry) {
      violations.push({ rule: 'tp-side', message: 'BUY: take_profit must be greater than entry_price' });
    }
    if (sl !== null && sl >= entry) {
      violations.push({ rule: 'sl-side', message: 'BUY: stop_loss must be less than entry_price' });
    }
  } else {
    if (tp !== null && tp >= entry) {
      violations.push({ rule: 'tp-side', message: 'SELL: take_profit must be less than entry_price' });
    }
    if (sl !== null && sl <= entry) {
      violations.push({ rule: 'sl-side', message: 'SELL: stop_loss must be greater than entry_price' });
    }
  }

  return violations;
}

/** PRS rules for closing: exit sane; closed_at >= opened_at. */
export function validateClose(
  trade: Pick<OpenTrade, 'openedAtMs'>,
  exitPricePts: number,
  closedAtMs: number,
): Violation[] {
  const violations: Violation[] = [];

  if (!Number.isInteger(exitPricePts) || exitPricePts <= 0) {
    violations.push({ rule: 'exit-positive', message: 'exit_price must be a positive price' });
  }

  if (closedAtMs < trade.openedAtMs) {
    violations.push({
      rule: 'closed-after-opened',
      message: 'closed_at must be at or after opened_at',
    });
  }

  return violations;
}
