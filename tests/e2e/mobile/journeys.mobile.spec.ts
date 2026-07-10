import { expect, test, type Page } from '@playwright/test';
import { commissionPence, grossPnlGbpPence } from '../../../src/core/pnl.js';

// MF-10 (the deliverable): the full trade lifecycle driven on REAL mobile
// device emulation - Pixel 7 (Chromium/Android) and iPhone 14 (WebKit/iOS),
// each a mobile viewport with hasTouch. Interactions use tap() (touch), not
// mouse click, and the seeded feed keeps every assertion deterministic.

const SEED = 771;

const toPts = (s: string): number => Math.round(parseFloat(s) * 100_000);
const gbp = (pence: number): string =>
  `${pence < 0 ? '-' : ''}£${(Math.abs(pence) / 100).toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

async function tapLogin(page: Page): Promise<void> {
  await page.goto(`/?seed=${SEED}`);
  await page.getByTestId('login-email').fill('ada@example.com');
  await page.getByTestId('login-password').fill('pw');
  await page.getByTestId('login-submit').tap(); // touch, not click
  await expect(page.getByTestId('trading-shell')).toBeVisible();
}

test('the device context is a touch-capable mobile viewport', async ({ page }) => {
  await tapLogin(page);

  // The layout resolves to mobile because the device viewport is < 600px wide.
  await expect(page.getByTestId('workspace')).toHaveAttribute('data-layout', 'mobile');

  const info = await page.evaluate(() => ({
    touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    width: window.innerWidth,
  }));
  expect(info.touch).toBe(true);
  expect(info.width).toBeLessThan(600);
});

test('full lifecycle by touch: login -> watchlist -> buy -> close -> history -> balance', async ({
  page,
}) => {
  await tapLogin(page);
  await expect(page.getByTestId('account-balance')).toHaveText('£10,000.00');

  // Watchlist is present and ticking on the device.
  await expect(page.getByTestId('watch-row-GBP/USD')).toBeVisible();

  // Place a BUY by touch.
  await page.getByTestId('order-pair').selectOption('GBP/USD');
  await page.getByTestId('order-volume').fill('0.10'); // lots2 = 10
  await page.getByTestId('order-buy').tap();

  const tradeId = await page
    .locator('[data-testid^="position-"][data-trade-id]')
    .getAttribute('data-trade-id');
  await expect(page.getByTestId(`position-${tradeId}`)).toBeVisible();

  // Let the price move, then close by touch.
  const priceCell = page.getByTestId(`position-price-${tradeId}`);
  const start = await priceCell.textContent();
  await expect.poll(async () => priceCell.textContent(), { timeout: 15_000 }).not.toBe(start);
  await page.getByTestId(`position-close-${tradeId}`).tap();

  // Race-free: predict net + new balance from the app-recorded entry/exit.
  await expect(page.getByTestId('positions-empty')).toBeVisible();
  const entryPts = toPts((await page.getByTestId(`history-entry-${tradeId}`).textContent()) ?? '');
  const exitPts = toPts((await page.getByTestId(`history-exit-${tradeId}`).textContent()) ?? '');
  const net = grossPnlGbpPence('GBP/USD', 'BUY', 10, entryPts, exitPts, exitPts) - commissionPence(10);

  await expect(page.getByTestId(`history-pnl-${tradeId}`)).toHaveText(gbp(net));
  await expect(page.getByTestId('account-balance')).toHaveText(gbp(1_000_000 + net));
});

test('a tap on a malformed login is rejected on the device', async ({ page }) => {
  await page.goto(`/?seed=${SEED}`);
  await page.getByTestId('login-email').fill('nope');
  await page.getByTestId('login-password').fill('pw');
  await page.getByTestId('login-submit').tap();
  await expect(page.getByTestId('login-errors')).toContainText('valid email');
});
