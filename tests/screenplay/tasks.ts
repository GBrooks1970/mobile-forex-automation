// Tasks (MF-12): the business-level activities of the mobile journeys. All
// interactions are TOUCH-first (tap, not click) — these run on the Pixel /
// iPhone device projects.

import { expect } from '@playwright/test';
import type { Actor, Task } from './core.js';
import { BrowseTheWeb } from './abilities/BrowseTheWeb.js';

/** Sign in to a fresh demo profile on a seeded app instance. */
export class Login implements Task {
  private constructor(
    private readonly seed: number,
    private readonly email: string,
    private readonly password: string,
  ) {}

  static toFreshDemoProfile(opts: { seed: number; email?: string; password?: string }): Login {
    return new Login(opts.seed, opts.email ?? 'ada@example.com', opts.password ?? 'pw');
  }

  async performAs(actor: Actor): Promise<void> {
    const { page } = actor.abilityTo(BrowseTheWeb);
    await page.goto(`/?seed=${this.seed}`);
    await page.getByTestId('login-email').fill(this.email);
    await page.getByTestId('login-password').fill(this.password);
    await page.getByTestId('login-submit').tap();
    await expect(page.getByTestId('trading-shell')).toBeVisible();
  }

  toString(): string {
    return `#actor signs in to a fresh demo profile (seed ${this.seed})`;
  }
}

/** Place a market order by touch. */
export class PlaceMarketOrder implements Task {
  private constructor(
    private readonly direction: 'BUY' | 'SELL',
    private readonly pair: string,
    private readonly volumeLots: string,
  ) {}

  static buy(pair: string, volumeLots: string): PlaceMarketOrder {
    return new PlaceMarketOrder('BUY', pair, volumeLots);
  }

  static sell(pair: string, volumeLots: string): PlaceMarketOrder {
    return new PlaceMarketOrder('SELL', pair, volumeLots);
  }

  async performAs(actor: Actor): Promise<void> {
    const { page } = actor.abilityTo(BrowseTheWeb);
    await page.getByTestId('order-pair').selectOption(this.pair);
    await page.getByTestId('order-volume').fill(this.volumeLots);
    await page.getByTestId(this.direction === 'BUY' ? 'order-buy' : 'order-sell').tap();
  }

  toString(): string {
    return `#actor places a market ${this.direction} of ${this.volumeLots} lots ${this.pair}`;
  }
}

/** Wait until a position's live price has moved off its current value. */
export class WaitUntilPriceMoves implements Task {
  private constructor(private readonly tradeId: string) {}

  static forPosition(tradeId: string): WaitUntilPriceMoves {
    return new WaitUntilPriceMoves(tradeId);
  }

  async performAs(actor: Actor): Promise<void> {
    const { page } = actor.abilityTo(BrowseTheWeb);
    const priceCell = page.getByTestId(`position-price-${this.tradeId}`);
    const start = await priceCell.textContent();
    await expect.poll(async () => priceCell.textContent(), { timeout: 15_000 }).not.toBe(start);
  }

  toString(): string {
    return `#actor waits for the price of position ${this.tradeId} to move`;
  }
}

/** Close an open position by touch. */
export class ClosePosition implements Task {
  private constructor(private readonly tradeId: string) {}

  static withId(tradeId: string): ClosePosition {
    return new ClosePosition(tradeId);
  }

  async performAs(actor: Actor): Promise<void> {
    const { page } = actor.abilityTo(BrowseTheWeb);
    await page.getByTestId(`position-close-${this.tradeId}`).tap();
    await expect(page.getByTestId('positions-empty')).toBeVisible();
  }

  toString(): string {
    return `#actor closes position ${this.tradeId}`;
  }
}
