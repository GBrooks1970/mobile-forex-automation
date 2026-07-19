import { expect, test, type Page } from '@playwright/test';

// MF-08 (FR-5): the workspace adapts. Verified by ACTUAL GEOMETRY (bounding
// boxes), not just the data-layout hint - mobile stacks the panes vertically,
// desktop places the watchlist beside the main dock. The device-emulation
// breakpoint suite (Pixel/iPhone, touch) is MF-11.

async function login(page: Page): Promise<void> {
  await page.goto('/?seed=1');
  await page.getByTestId('login-email').fill('ada@example.com');
  await page.getByTestId('login-password').fill('pw');
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('trading-shell')).toBeVisible();
}

test('mobile (375px): panes stack in a single column', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await login(page);

  await expect(page.getByTestId('workspace')).toHaveAttribute('data-layout', 'mobile');

  const watch = await page.getByTestId('col-watch').boundingBox();
  const main = await page.getByTestId('col-main').boundingBox();
  expect(watch).not.toBeNull();
  expect(main).not.toBeNull();
  // TS narrowing only -- the expects above already fail the test first if either is null.
  // eslint-disable-next-line playwright/no-conditional-in-test
  if (!watch || !main) return;

  // Stacked: the main column starts at/after the watchlist column's bottom, and
  // both share (roughly) the same left edge.
  expect(main.y).toBeGreaterThanOrEqual(watch.y + watch.height - 1);
  expect(Math.abs(main.x - watch.x)).toBeLessThan(2);
});

test('desktop (1280px): watchlist sits beside the main dock', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await login(page);

  await expect(page.getByTestId('workspace')).toHaveAttribute('data-layout', 'desktop');

  const watch = await page.getByTestId('col-watch').boundingBox();
  const main = await page.getByTestId('col-main').boundingBox();
  expect(watch).not.toBeNull();
  expect(main).not.toBeNull();
  // TS narrowing only -- the expects above already fail the test first if either is null.
  // eslint-disable-next-line playwright/no-conditional-in-test
  if (!watch || !main) return;

  // Side by side: the main column is to the RIGHT of the watchlist, and their
  // vertical ranges overlap (same row).
  expect(main.x).toBeGreaterThan(watch.x + watch.width - 1);
  const verticalOverlap = Math.min(watch.y + watch.height, main.y + main.height) - Math.max(watch.y, main.y);
  expect(verticalOverlap).toBeGreaterThan(0);
});

test('the layout reflows live when the viewport crosses a breakpoint', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await login(page);
  await expect(page.getByTestId('workspace')).toHaveAttribute('data-layout', 'desktop');

  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.getByTestId('workspace')).toHaveAttribute('data-layout', 'mobile');

  await page.setViewportSize({ width: 800, height: 900 });
  await expect(page.getByTestId('workspace')).toHaveAttribute('data-layout', 'tablet');
});
