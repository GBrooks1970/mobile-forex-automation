import { expect, test, type Page } from '@playwright/test';

// MF-11 (FR-5, device side): the responsive layout verified on the REAL device
// viewports (Pixel 7 / iPhone 14), not a resized desktop window. The desktop
// split half is covered by tests/e2e/responsive.spec.ts on the desktop project;
// this asserts the single-pane mobile layout holds on genuine devices, by
// geometry, plus mobile hygiene (no horizontal overflow).

async function login(page: Page): Promise<void> {
  await page.goto('/?seed=11');
  await page.getByTestId('login-email').fill('ada@example.com');
  await page.getByTestId('login-password').fill('pw');
  await page.getByTestId('login-submit').tap();
  await expect(page.getByTestId('trading-shell')).toBeVisible();
}

test('the device is a portrait, sub-600px viewport that selects the mobile layout', async ({
  page,
}) => {
  await login(page);
  const vp = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }));
  expect(vp.w).toBeLessThan(600);
  expect(vp.h).toBeGreaterThan(vp.w); // portrait
  await expect(page.getByTestId('workspace')).toHaveAttribute('data-layout', 'mobile');
});

test('the workspace is single-pane on the device: panes stack, not side by side', async ({
  page,
}) => {
  await login(page);
  const watch = await page.getByTestId('col-watch').boundingBox();
  const main = await page.getByTestId('col-main').boundingBox();
  expect(watch).not.toBeNull();
  expect(main).not.toBeNull();
  // TS narrowing only -- the expects above already fail the test first if either is null.
  // eslint-disable-next-line playwright/no-conditional-in-test
  if (!watch || !main) return;

  // Stacked: main starts at/after the watchlist's bottom, sharing the left edge.
  expect(main.y).toBeGreaterThanOrEqual(watch.y + watch.height - 1);
  expect(Math.abs(main.x - watch.x)).toBeLessThan(2);
});

test('the trading shell fits the device width (no horizontal overflow)', async ({ page }) => {
  await login(page);
  // Open a position too, so the positions table is on screen (the widest content).
  await page.getByTestId('order-volume').fill('0.10');
  await page.getByTestId('order-buy').tap();
  await expect(page.locator('[data-testid^="position-"][data-trade-id]')).toHaveCount(1);

  const overflow = await page.evaluate(() => ({
    docScroll: document.documentElement.scrollWidth,
    inner: window.innerWidth,
  }));
  // Allow 1px of sub-pixel slack; anything more means content spills sideways.
  expect(overflow.docScroll).toBeLessThanOrEqual(overflow.inner + 1);
});
