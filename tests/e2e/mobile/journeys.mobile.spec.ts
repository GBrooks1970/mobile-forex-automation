import { expect, test } from '@playwright/test';
import { commissionPence, grossPnlGbpPence } from '../../../src/core/pnl.js';
import { Actor } from '../../screenplay/core.js';
import { BrowseTheWeb } from '../../screenplay/abilities/BrowseTheWeb.js';
import { ClosePosition, Login, PlaceMarketOrder, WaitUntilPriceMoves } from '../../screenplay/tasks.js';
import {
  TheAccountBalance,
  TheOpenPositionId,
  TheRecordedNetPnl,
  TheRecordedPrices,
  TheWorkspaceLayout,
} from '../../screenplay/questions.js';

// MF-10/MF-12 (the deliverable): the full trade lifecycle on REAL mobile device
// emulation — Pixel 7 (Chromium/Android) and iPhone 14 (WebKit/iOS), touch
// throughout — expressed in the portfolio's Screenplay style: an actor who,
// able to browse the web, attempts tasks and asks questions. The seeded feed
// keeps every assertion deterministic (exact values, no tolerance).

const SEED = 771;

const gbp = (pence: number): string =>
  `${pence < 0 ? '-' : ''}£${(Math.abs(pence) / 100).toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

test('the device context is a touch-capable mobile viewport', async ({ page }) => {
  const ada = Actor.named('Ada').whoCan(BrowseTheWeb.using(page));
  await ada.attemptsTo(Login.toFreshDemoProfile({ seed: SEED }));

  expect(await ada.asks(TheWorkspaceLayout.current())).toBe('mobile');

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
  const ada = Actor.named('Ada').whoCan(BrowseTheWeb.using(page));

  await ada.attemptsTo(Login.toFreshDemoProfile({ seed: SEED }));
  expect(await ada.asks(TheAccountBalance.displayed())).toBe('£10,000.00');
  await expect(page.getByTestId('watch-row-GBP/USD')).toBeVisible();

  await ada.attemptsTo(PlaceMarketOrder.buy('GBP/USD', '0.10')); // lots2 = 10
  const tradeId = await ada.asks(TheOpenPositionId.ofTheOnlyPosition());

  await ada.attemptsTo(
    WaitUntilPriceMoves.forPosition(tradeId),
    ClosePosition.withId(tradeId),
  );

  // Race-free determinism: predict net + new balance from the entry/exit the
  // APP RECORDED in the history row, via the same core the app uses.
  const { entryPts, exitPts } = await ada.asks(TheRecordedPrices.ofClosedTrade(tradeId));
  const net = grossPnlGbpPence('GBP/USD', 'BUY', 10, entryPts, exitPts, exitPts) - commissionPence(10);

  expect(await ada.asks(TheRecordedNetPnl.ofClosedTrade(tradeId))).toBe(gbp(net));
  expect(await ada.asks(TheAccountBalance.displayed())).toBe(gbp(1_000_000 + net));
});

test('a tap on a malformed login is rejected on the device', async ({ page }) => {
  await page.goto(`/?seed=${SEED}`);
  await page.getByTestId('login-email').fill('nope');
  await page.getByTestId('login-password').fill('pw');
  await page.getByTestId('login-submit').tap();
  await expect(page.getByTestId('login-errors')).toContainText('valid email');
});
