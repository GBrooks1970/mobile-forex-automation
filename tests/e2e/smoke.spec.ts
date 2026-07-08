import { expect, test } from '@playwright/test';

// App-shell smoke (MF-01, updated in MF-04): a fresh visitor lands on the
// login screen. The full journeys live in login.spec.ts and (from MF-10) the
// mobile-emulation suite.
test('a fresh visitor sees the app title and the login form', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('app-title')).toHaveText('Forex Demo');
  await expect(page.getByTestId('login-form')).toBeVisible();
  await expect(page.getByTestId('login-submit')).toBeEnabled();
});
