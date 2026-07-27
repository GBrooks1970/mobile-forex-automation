import { expect, test, type Page } from '@playwright/test';

// ADR-0002 / CODEX-05: identity is persistent; trading activity is page-lifetime state.

const SEED = 5150;
const EMAIL = 'reload-contract@example.com';
const RESET_CUE = 'Demo activity resets on reload; your profile stays signed in.';

async function login(page: Page): Promise<void> {
  await page.goto(`/?seed=${SEED}`);
  await page.getByTestId('login-email').fill(EMAIL);
  await page.getByTestId('login-password').fill('pw');
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('trading-shell')).toBeVisible();
}

async function placeBuy(page: Page): Promise<string> {
  await page.getByTestId('order-volume').fill('0.10');
  await page.getByTestId('order-buy').click();

  const row = page.locator('[data-testid^="position-"][data-trade-id]');
  await expect(row).toHaveCount(1);
  const tradeId = await row.getAttribute('data-trade-id');
  if (tradeId === null) throw new Error('Open position has no trade id');
  return tradeId;
}

test('reload keeps the profile and resets balance changes, positions, and history', async ({
  page,
}) => {
  await login(page);
  await expect(page.getByTestId('demo-reset-hint')).toHaveText(RESET_CUE);

  const closedTradeId = await placeBuy(page);
  await page.getByTestId(`position-close-${closedTradeId}`).click();

  await expect(page.locator(`[data-testid^="history-"][data-trade-id="${closedTradeId}"]`)).toHaveCount(1);
  await expect(page.getByTestId('account-balance')).not.toHaveText('£10,000.00');

  const openTradeId = await placeBuy(page);
  await expect(page.getByTestId(`position-${openTradeId}`)).toBeVisible();

  await page.reload();

  await expect(page.getByTestId('trading-shell')).toBeVisible();
  await expect(page.getByTestId('login-form')).toHaveCount(0);
  await expect(page.getByTestId('account-email')).toHaveText(EMAIL);
  await expect(page.getByTestId('account-balance')).toHaveText('£10,000.00');
  await expect(page.getByTestId('positions-empty')).toBeVisible();
  await expect(page.getByTestId('history-empty')).toBeVisible();
  await expect(page.getByTestId(`position-${openTradeId}`)).toHaveCount(0);
  await expect(page.locator(`[data-testid^="history-"][data-trade-id="${closedTradeId}"]`)).toHaveCount(0);
  await expect(page.getByTestId('demo-reset-hint')).toHaveText(RESET_CUE);
});
