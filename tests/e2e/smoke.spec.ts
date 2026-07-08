import { expect, test } from '@playwright/test';

// MF-01 placeholder: proves the Playwright lane (build -> preview -> browser)
// is wired. The mobile-emulation journeys land in MF-10/MF-11.
test('the app shell loads and renders its title', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('app-title')).toHaveText('Forex Demo');
  await expect(page.getByTestId('app-status')).toContainText('scaffold');
});
