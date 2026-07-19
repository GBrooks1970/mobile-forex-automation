// Questions (MF-12): what the actor can read back from the app. Pure reads —
// no interactions — returning values the specs assert on.

import type { Actor, Question } from './core.js';
import { BrowseTheWeb } from './abilities/BrowseTheWeb.js';
import { parsePricePts } from '../support/prices.js';
import type { CurrencyPair } from '../../src/core/types.js';

/** The displayed account cash balance, e.g. "£10,000.00". */
export class TheAccountBalance implements Question<string> {
  static displayed(): TheAccountBalance {
    return new TheAccountBalance();
  }

  async answeredBy(actor: Actor): Promise<string> {
    const { page } = actor.abilityTo(BrowseTheWeb);
    return (await page.getByTestId('account-balance').textContent()) ?? '';
  }

  toString(): string {
    return 'the displayed account balance';
  }
}

/** The trade id of the (single) open position. */
export class TheOpenPositionId implements Question<string> {
  static ofTheOnlyPosition(): TheOpenPositionId {
    return new TheOpenPositionId();
  }

  async answeredBy(actor: Actor): Promise<string> {
    const { page } = actor.abilityTo(BrowseTheWeb);
    const id = await page
      .locator('[data-testid^="position-"][data-trade-id]')
      .getAttribute('data-trade-id');
    if (!id) throw new Error('no open position found');
    return id;
  }

  toString(): string {
    return 'the trade id of the open position';
  }
}

/** The entry/exit prices the app recorded in a trade's history row (integer points). */
export class TheRecordedPrices implements Question<{ entryPts: number; exitPts: number }> {
  private constructor(
    private readonly tradeId: string,
    private readonly pair: CurrencyPair,
  ) {}

  static ofClosedTrade(tradeId: string, pair: CurrencyPair): TheRecordedPrices {
    return new TheRecordedPrices(tradeId, pair);
  }

  async answeredBy(actor: Actor): Promise<{ entryPts: number; exitPts: number }> {
    const { page } = actor.abilityTo(BrowseTheWeb);
    const entry = (await page.getByTestId(`history-entry-${this.tradeId}`).textContent()) ?? '';
    const exit = (await page.getByTestId(`history-exit-${this.tradeId}`).textContent()) ?? '';
    return {
      entryPts: parsePricePts(this.pair, entry),
      exitPts: parsePricePts(this.pair, exit),
    };
  }

  toString(): string {
    return `the recorded entry/exit prices of closed trade ${this.tradeId}`;
  }
}

/** The displayed net P&L of a closed trade's history row. */
export class TheRecordedNetPnl implements Question<string> {
  private constructor(private readonly tradeId: string) {}

  static ofClosedTrade(tradeId: string): TheRecordedNetPnl {
    return new TheRecordedNetPnl(tradeId);
  }

  async answeredBy(actor: Actor): Promise<string> {
    const { page } = actor.abilityTo(BrowseTheWeb);
    return ((await page.getByTestId(`history-pnl-${this.tradeId}`).textContent()) ?? '').trim();
  }

  toString(): string {
    return `the recorded net P&L of closed trade ${this.tradeId}`;
  }
}

/** The active responsive layout ("mobile" | "tablet" | "desktop"). */
export class TheWorkspaceLayout implements Question<string> {
  static current(): TheWorkspaceLayout {
    return new TheWorkspaceLayout();
  }

  async answeredBy(actor: Actor): Promise<string> {
    const { page } = actor.abilityTo(BrowseTheWeb);
    return (await page.getByTestId('workspace').getAttribute('data-layout')) ?? '';
  }

  toString(): string {
    return 'the active workspace layout';
  }
}
