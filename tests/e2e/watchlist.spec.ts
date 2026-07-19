import { expect, test } from '@playwright/test';
import { createFeed } from '../../src/core/feed.js';
import { formatPricePts } from '../../src/core/format.js';
import { MVP_PAIRS } from '../../src/core/types.js';

// FR-2 (MF-05): the watchlist shows the 5 MVP pairs, ticking deterministically
// under ?seed=. The killer assertion: we REPLAY the same seeded feed in the
// test and predict the EXACT price and flash direction the UI must be showing
// at whatever seq we happen to observe — timing-independent determinism.

const SEED = 4242;

async function login(page: import('@playwright/test').Page): Promise<void> {
  await page.goto(`/?seed=${SEED}`);
  await page.getByTestId('login-email').fill('ada@example.com');
  await page.getByTestId('login-password').fill('pw');
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('trading-shell')).toBeVisible();
}

test('shows all five MVP pairs', async ({ page }) => {
  await login(page);
  for (const pair of MVP_PAIRS) {
    await expect(page.getByTestId(`watch-row-${pair}`)).toBeVisible();
  }
});

test('prices tick deterministically under the seed (replay predicts the exact price)', async ({
  page,
}) => {
  await login(page);
  const row = page.getByTestId('watch-row-GBP/USD');

  // Wait until at least 3 ticks have landed, then read the seq we got.
  await expect(row).toHaveAttribute('data-seq', /^[3-9]\d*$|^[1-9]\d+$/, { timeout: 15_000 });
  const seq = Number(await row.getAttribute('data-seq'));
  const shownPrice = await page.getByTestId('watch-price-GBP/USD').textContent();
  const shownDirection = await row.getAttribute('data-direction');

  // Replay the same seed to the same seq and predict what MUST be on screen.
  // (The ticker advances every pair once per interval, so per-pair seq is
  // simply how many ticks that pair has taken.)
  const replay = createFeed(SEED);
  let predicted = { pricePts: 0, direction: 'flat' as string };
  for (let i = 0; i < seq; i++) {
    const tick = replay.nextTick('GBP/USD');
    predicted = { pricePts: tick.pricePts, direction: tick.direction };
  }

  // shownPrice/shownDirection are a point-in-time snapshot paired with `seq` above, not a
  // live locator read: a retrying web-first assertion here could poll past this tick and
  // race the tearing this file's other test explicitly guards against with an atomic
  // in-page evaluate().
  // eslint-disable-next-line playwright/prefer-web-first-assertions
  expect(shownPrice).toBe(formatPricePts('GBP/USD', predicted.pricePts));
  // eslint-disable-next-line playwright/prefer-web-first-assertions -- see above
  expect(shownDirection).toBe(predicted.direction);
});

test('tick flashes colour the price cell by direction (green up, red down)', async ({ page }) => {
  await login(page);
  const row = page.getByTestId('watch-row-EUR/USD');

  // Observe ticks until we have seen both an up and a down (the seeded walk
  // yields both quickly), asserting class <-> data-direction agreement on an
  // ATOMIC in-page read each time (avoids tearing across a tick boundary).
  const seen = new Set<string>();
  let lastSeq = 0;
  // The loop bound and the branch on each tick's observed direction are inherent to this
  // test's design: it can't know in advance which ticks will be up vs. down, only that the
  // seeded walk yields both within 30 attempts. Whichever direction is observed, its
  // class <-> data-direction agreement is still unconditionally asserted every iteration.
  /* eslint-disable playwright/no-conditional-in-test, playwright/no-conditional-expect */
  for (let attempts = 0; attempts < 30 && seen.size < 2; attempts++) {
    await expect
      .poll(async () => Number(await row.getAttribute('data-seq')), { timeout: 15_000 })
      .toBeGreaterThan(lastSeq);
    const snap = await row.evaluate((el) => ({
      seq: Number((el as HTMLElement).dataset['seq']),
      direction: (el as HTMLElement).dataset['direction'],
      cls: (el as HTMLElement).className,
    }));
    lastSeq = snap.seq;
    if (snap.direction === 'up') {
      expect(snap.cls).toContain('tick-up');
      expect(snap.cls).not.toContain('tick-down');
      seen.add('up');
    } else if (snap.direction === 'down') {
      expect(snap.cls).toContain('tick-down');
      expect(snap.cls).not.toContain('tick-up');
      seen.add('down');
    }
  }
  /* eslint-enable playwright/no-conditional-in-test, playwright/no-conditional-expect */
  expect([...seen].sort()).toEqual(['down', 'up']);
});

test('signing out stops the watchlist (no rows on the login screen)', async ({ page }) => {
  await login(page);
  await page.getByTestId('sign-out').click();
  await expect(page.getByTestId('login-form')).toBeVisible();
  await expect(page.getByTestId('watchlist')).toHaveCount(0);
});
