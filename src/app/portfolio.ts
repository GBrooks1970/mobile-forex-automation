// Portfolio state (MF-06/07): the demo account's cash balance and open
// positions. App-layer state (allowed to be mutable) but every operation is
// deterministic given its inputs — no RNG, no Date.now() (NFR-1): trade ids
// come from a counter, timestamps are passed in.
//
// MVP money model (documented in the design doc): opening a market order does
// NOT touch the cash balance (paper trading, no margin); the position carries
// an UNREALISED floating P&L (gross, at the live price). Realised net P&L is
// applied to the cash balance on close (MF-07). MVP closes are same-day, so
// swap is zero here (the swap maths remain unit-tested for completeness).

import { grossPnlGbpPence } from '../core/pnl.js';
import type { CurrencyPair, OpenTrade, TradeDirection } from '../core/types.js';
import { validateOpen, type Violation } from '../core/validate.js';

export interface OrderRequest {
  currencyPair: CurrencyPair;
  tradeDirection: TradeDirection;
  volumeLots2: number;
}

export type OpenOutcome =
  | { ok: true; trade: OpenTrade }
  | { ok: false; violations: Violation[] };

export class Portfolio {
  private balance: number;
  private readonly trades = new Map<string, OpenTrade>();
  private seq = 0;

  constructor(
    private readonly userId: string,
    openingBalancePence: number,
  ) {
    this.balance = openingBalancePence;
  }

  balancePence(): number {
    return this.balance;
  }

  openPositions(): OpenTrade[] {
    return [...this.trades.values()];
  }

  getPosition(tradeId: string): OpenTrade | undefined {
    return this.trades.get(tradeId);
  }

  /** Deterministic trade id: demo user + zero-padded counter. */
  private nextTradeId(): string {
    this.seq += 1;
    return `${this.userId}-t${String(this.seq).padStart(4, '0')}`;
  }

  /** Open a market order at `entryPricePts`. Validates per the PRS rules. */
  open(order: OrderRequest, entryPricePts: number, openedAtMs: number): OpenOutcome {
    const violations = validateOpen({
      currencyPair: order.currencyPair,
      tradeDirection: order.tradeDirection,
      volumeLots2: order.volumeLots2,
      entryPricePts,
      stopLossPts: null,
      takeProfitPts: null,
    });
    if (violations.length > 0) return { ok: false, violations };

    const trade: OpenTrade = {
      tradeId: this.nextTradeId(),
      userId: this.userId,
      currencyPair: order.currencyPair,
      tradeDirection: order.tradeDirection,
      volumeLots2: order.volumeLots2,
      entryPricePts,
      currentPricePts: entryPricePts,
      stopLossPts: null,
      takeProfitPts: null,
      openedAtMs,
    };
    this.trades.set(trade.tradeId, trade);
    return { ok: true, trade };
  }

  /** Update a position's live price (called on tick). No-op if unknown. */
  markPrice(tradeId: string, currentPricePts: number): void {
    const trade = this.trades.get(tradeId);
    if (trade) trade.currentPricePts = currentPricePts;
  }

  /** Unrealised (floating) gross P&L in pence at a position's current price. */
  floatingPnlPence(tradeId: string, gbpQuoteRatePts: number | null): number {
    const t = this.trades.get(tradeId);
    if (!t) return 0;
    return grossPnlGbpPence(
      t.currencyPair,
      t.tradeDirection,
      t.volumeLots2,
      t.entryPricePts,
      t.currentPricePts,
      gbpQuoteRatePts,
    );
  }

  /** Sum of floating P&L across all open positions (needs a rate per pair). */
  totalFloatingPnlPence(rateFor: (pair: CurrencyPair) => number | null): number {
    let total = 0;
    for (const t of this.trades.values()) {
      total += grossPnlGbpPence(
        t.currencyPair,
        t.tradeDirection,
        t.volumeLots2,
        t.entryPricePts,
        t.currentPricePts,
        rateFor(t.currencyPair),
      );
    }
    return total;
  }

  /** Equity = cash balance + total floating P&L. */
  equityPence(rateFor: (pair: CurrencyPair) => number | null): number {
    return this.balance + this.totalFloatingPnlPence(rateFor);
  }
}
