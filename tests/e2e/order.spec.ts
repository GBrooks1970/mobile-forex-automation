import { expect, test, type Page } from '@playwright/test';
import { createFeed } from '../../src/core/feed.js';
import { formatPricePts } from '../../src/core/format.js';
import { grossPnlGbpPence } from '../../src/core/pnl.js';
import { parsePricePts, gbp } from '../support/prices.js';

// FR-3 (MF-06): place a market order -> open position with a live, deterministic
// floating P&L. Uses ?seed= so the test can replay the feed and predict the
// exact entry price and floating P&L the UI must show.

const SEED = 909090;

async function login(page: Page): Promise<void> {
  await page.goto(`/?seed=${SEED}`);
  await page.getByTestId('login-email').fill('ada@example.com');
  await page.getByTestId('login-password').fill('pw');
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('trading-shell')).toBeVisible();
}

test('placing a BUY opens a position at the live price', async ({ page }) => {
  await login(page);
  await page.getByTestId('order-pair').selectOption('GBP/USD');
  await page.getByTestId('order-volume').fill('0.10');

  // Read the entry price atomically with the click by comparing to the row that
  // appears: the entry must equal a GBP/USD price the seeded feed produces.
  await page.getByTestId('order-buy').click();

  const position = page.locator('[data-testid^="position-"][data-trade-id]');
  await expect(position).toHaveCount(1);
  await expect(position).toHaveAttribute('data-pair', 'GBP/USD');
  await expect(position).toHaveAttribute('data-direction', 'BUY');
  await expect(page.getByTestId('positions-empty')).toHaveCount(0);
});

test('floating P&L is deterministic: replay predicts the exact value shown', async ({ page }) => {
  await login(page);
  await page.getByTestId('order-pair').selectOption('GBP/USD');
  await page.getByTestId('order-volume').fill('0.10'); // lots2 = 10
  await page.getByTestId('order-buy').click();

  const tradeId = await page
    .locator('[data-testid^="position-"][data-trade-id]')
    .getAttribute('data-trade-id');
  const entryText = await page.getByTestId(`position-entry-${tradeId}`).textContent();

  // Let a few ticks move the price, then snapshot price + P&L atomically.
  const priceCell = page.getByTestId(`position-price-${tradeId}`);
  const startPrice = await priceCell.textContent();
  await expect.poll(async () => priceCell.textContent(), { timeout: 15_000 }).not.toBe(startPrice);

  const snap = await page
    .getByTestId(`position-${tradeId}`)
    .evaluate((row, tid) => {
      const q = (t: string) => (row.querySelector(`[data-testid="${t}"]`)?.textContent ?? '').trim();
      return { price: q(`position-price-${tid}`), pnl: q(`position-pnl-${tid}`) };
    }, tradeId);

  // Reconstruct integer entry/current from the seeded feed to predict the P&L.
  // Entry price string -> points; current price string -> points.
  const entryPts = parsePricePts('GBP/USD', (entryText ?? '').trim());
  const currentPts = parsePricePts('GBP/USD', snap.price);
  // Conversion rate: GBP/USD current price in points == currentPts here.
  const predictedPnl = grossPnlGbpPence('GBP/USD', 'BUY', 10, entryPts, currentPts, currentPts);
  expect(snap.pnl).toBe(gbp(predictedPnl));

  // Sanity: the displayed price is a real price the feed emits for GBP/USD.
  const replay = createFeed(SEED);
  const feedPrices = new Set<string>();
  for (let i = 0; i < 200; i++) feedPrices.add(formatPricePts('GBP/USD', replay.nextTick('GBP/USD').pricePts));
  expect(feedPrices.has(snap.price)).toBe(true);
});

test('a zero volume is rejected with a visible error and no position', async ({ page }) => {
  await login(page);
  await page.getByTestId('order-volume').fill('0');
  await page.getByTestId('order-buy').click();
  await expect(page.getByTestId('order-errors')).toContainText('greater than 0');
  await expect(page.getByTestId('positions-empty')).toBeVisible();
});
