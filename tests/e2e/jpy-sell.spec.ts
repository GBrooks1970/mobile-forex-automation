import { expect, test, type Page } from '@playwright/test';
import { commissionPence, grossPnlGbpPence } from '../../src/core/pnl.js';
import { gbp, parsePricePts } from '../support/prices.js';

// CODEX-08 / review R-6: connect the JPY-precision and SELL partitions through
// the desktop UI without multiplying the Pixel/iPhone project matrix.

const SEED = 5150;
const PAIR = 'USD/JPY' as const;
const VOLUME_LOTS2 = 10;

async function login(page: Page): Promise<void> {
  await page.goto(`/?seed=${SEED}`);
  await page.getByTestId('login-email').fill('ada@example.com');
  await page.getByTestId('login-password').fill('pw');
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('trading-shell')).toBeVisible();
}

test('USD/JPY SELL keeps three-decimal prices and exact signed history', async ({ page }) => {
  await login(page);
  await page.getByTestId('order-pair').selectOption(PAIR);
  await page.getByTestId('order-volume').fill('0.10');
  await page.getByTestId('order-sell').click();

  const position = page.locator('[data-testid^="position-"][data-trade-id]');
  await expect(position).toHaveCount(1);
  await expect(position).toHaveAttribute('data-pair', PAIR);
  await expect(position).toHaveAttribute('data-direction', 'SELL');

  const observedTradeId = await position.getAttribute('data-trade-id');
  expect(observedTradeId).not.toBeNull();
  const tradeId = observedTradeId as string;

  const entryCell = page.getByTestId(`position-entry-${tradeId}`);
  const priceCell = page.getByTestId(`position-price-${tradeId}`);
  await expect(entryCell).toHaveText(/^\d+\.\d{3}$/);
  const entryText = (await entryCell.textContent())?.trim() ?? '';

  await expect
    .poll(async () => (await priceCell.textContent())?.trim(), { timeout: 15_000 })
    .not.toBe(entryText);

  // Capture the JPY exit and GBP/USD conversion rate, then dispatch Close in
  // the same browser task. The ticker cannot interleave these values with the
  // synchronous close handler that writes history.
  const closeSnapshot = await position.evaluate((row, id) => {
    const text = (selector: string): string =>
      (document.querySelector(selector)?.textContent ?? '').trim();
    const close = row.querySelector<HTMLButtonElement>(`[data-testid="position-close-${id}"]`);
    if (close === null) throw new Error('Position has no Close button');
    const snapshot = {
      exit: text(`[data-testid="position-price-${id}"]`),
      gbpUsdRate: text('[data-testid="watch-price-GBP/USD"]'),
    };
    close.click();
    return snapshot;
  }, tradeId);

  expect(closeSnapshot.exit).toMatch(/^\d+\.\d{3}$/);
  expect(closeSnapshot.gbpUsdRate).toMatch(/^\d+\.\d{5}$/);

  const history = page.locator(`[data-testid^="history-"][data-trade-id="${tradeId}"]`);
  await expect(history).toHaveCount(1);
  await expect(history).toHaveAttribute('data-reason', 'MANUAL');
  await expect(history).toContainText(PAIR);
  await expect(history).toContainText('SELL');
  await expect(history).toContainText('0.10');

  const historyEntry = page.getByTestId(`history-entry-${tradeId}`);
  const historyExit = page.getByTestId(`history-exit-${tradeId}`);
  const historyPnl = page.getByTestId(`history-pnl-${tradeId}`);
  await expect(historyEntry).toHaveText(/^\d+\.\d{3}$/);
  await expect(historyExit).toHaveText(closeSnapshot.exit);

  const entryPts = parsePricePts(PAIR, (await historyEntry.textContent()) ?? '');
  const exitPts = parsePricePts(PAIR, closeSnapshot.exit);
  const gbpUsdRatePts = parsePricePts('GBP/USD', closeSnapshot.gbpUsdRate);
  expect(exitPts).not.toBe(entryPts);

  const gross = grossPnlGbpPence(
    PAIR,
    'SELL',
    VOLUME_LOTS2,
    entryPts,
    exitPts,
    gbpUsdRatePts,
  );
  const net = gross - commissionPence(VOLUME_LOTS2);
  const expectedPnl = gbp(net);
  await expect(historyPnl).toHaveText(expectedPnl);
  await expect(page.getByTestId('account-balance')).toHaveText(gbp(1_000_000 + net));

  // A later tick must not mutate the closed row's recorded values.
  const watchRow = page.getByTestId(`watch-row-${PAIR}`);
  const closedAtSeq = Number(await watchRow.getAttribute('data-seq'));
  await expect
    .poll(async () => Number(await watchRow.getAttribute('data-seq')), { timeout: 15_000 })
    .toBeGreaterThan(closedAtSeq);
  await expect(historyEntry).toHaveText(entryText);
  await expect(historyExit).toHaveText(closeSnapshot.exit);
  await expect(historyPnl).toHaveText(expectedPnl);
});
