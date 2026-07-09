import { expect, test, type Page } from '@playwright/test';
import { commissionPence, grossPnlGbpPence } from '../../src/core/pnl.js';

// FR-4 (MF-07): close a position -> realised net P&L -> immutable history row
// -> cash balance updates by EXACTLY the net (replay-predicted, no tolerance).

const SEED = 5150;

async function login(page: Page): Promise<void> {
  await page.goto(`/?seed=${SEED}`);
  await page.getByTestId('login-email').fill('ada@example.com');
  await page.getByTestId('login-password').fill('pw');
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('trading-shell')).toBeVisible();
}

const toPts = (s: string): number => Math.round(parseFloat(s) * 100_000);
const gbp = (pence: number): string =>
  `${pence < 0 ? '-' : ''}£${(Math.abs(pence) / 100).toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

test('closing a position realises net P&L, writes history, and moves the balance exactly', async ({
  page,
}) => {
  await login(page);
  await expect(page.getByTestId('account-balance')).toHaveText('£10,000.00');

  await page.getByTestId('order-pair').selectOption('GBP/USD');
  await page.getByTestId('order-volume').fill('0.10'); // lots2 = 10
  await page.getByTestId('order-buy').click();

  const tradeId = await page
    .locator('[data-testid^="position-"][data-trade-id]')
    .getAttribute('data-trade-id');

  // Let the price move a few ticks so the close isn't a no-op, then close.
  const priceCell = page.getByTestId(`position-price-${tradeId}`);
  const start = await priceCell.textContent();
  await expect.poll(async () => priceCell.textContent(), { timeout: 15_000 }).not.toBe(start);
  await page.getByTestId(`position-close-${tradeId}`).click();

  // Position gone; one history row for this trade.
  await expect(page.getByTestId('positions-empty')).toBeVisible();
  const histRow = page.locator(`[data-testid^="history-"][data-trade-id="${tradeId}"]`);
  await expect(histRow).toHaveCount(1);

  // Race-free: predict net from the entry/exit the APP RECORDED in the history
  // row (not from a live cell that a tick could change under us). This verifies
  // the app's own internal consistency: net = gross(entry->exit) - commission,
  // and that the balance moved by exactly that net.
  const entryPts = toPts((await page.getByTestId(`history-entry-${tradeId}`).textContent()) ?? '');
  const exitPts = toPts((await page.getByTestId(`history-exit-${tradeId}`).textContent()) ?? '');
  const gross = grossPnlGbpPence('GBP/USD', 'BUY', 10, entryPts, exitPts, exitPts);
  const net = gross - commissionPence(10);

  await expect(page.getByTestId(`history-pnl-${tradeId}`)).toHaveText(gbp(net));
  await expect(page.getByTestId('account-balance')).toHaveText(gbp(1_000_000 + net));
});

test('the closed trade is recorded in history tagged MANUAL', async ({ page }) => {
  await login(page);
  await page.getByTestId('order-volume').fill('0.10');
  await page.getByTestId('order-buy').click();
  const tradeId = await page
    .locator('[data-testid^="position-"][data-trade-id]')
    .getAttribute('data-trade-id');
  await page.getByTestId(`position-close-${tradeId}`).click();

  const histRow = page.locator(`[data-testid^="history-"][data-trade-id="${tradeId}"]`);
  await expect(histRow).toHaveAttribute('data-reason', 'MANUAL');
  await expect(page.getByTestId('history-empty')).toHaveCount(0);
});
