import { expect, test } from '@playwright/test';

// FR-1: login generates a £10,000 demo profile (MF-04).

test('logging in creates the £10,000 demo profile', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('login-email').fill('ada@example.com');
  await page.getByTestId('login-password').fill('any-password');
  await page.getByTestId('login-submit').click();

  await expect(page.getByTestId('trading-shell')).toBeVisible();
  await expect(page.getByTestId('account-email')).toHaveText('ada@example.com');
  await expect(page.getByTestId('account-balance')).toHaveText('£10,000.00');
});

test('a crafted email cannot inject markup into the signed-in indicator', async ({ page }) => {
  // The email shape check (validateCredentials) admits any non-whitespace
  // character, including `<`/`>` — the account-email span must render this
  // as literal text, not parse it as HTML.
  await page.goto('/');
  await page.getByTestId('login-email').fill('<b>x</b>@x.co');
  await page.getByTestId('login-password').fill('any-password');
  await page.getByTestId('login-submit').click();

  await expect(page.getByTestId('trading-shell')).toBeVisible();
  const emailField = page.getByTestId('account-email');
  await expect(emailField).toHaveText('<b>x</b>@x.co');
  await expect(emailField.locator('b')).toHaveCount(0); // no injected element
});

test('a malformed email is rejected with a visible error', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('login-email').fill('not-an-email');
  await page.getByTestId('login-password').fill('pw');
  await page.getByTestId('login-submit').click();

  await expect(page.getByTestId('login-errors')).toContainText('valid email');
  await expect(page.getByTestId('login-form')).toBeVisible(); // still on login
  await expect(page.getByTestId('login-email')).toHaveValue('not-an-email'); // typed value preserved
});

test('the profile survives a reload and sign-out returns to login', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('login-email').fill('ada@example.com');
  await page.getByTestId('login-password').fill('pw');
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('trading-shell')).toBeVisible();

  await page.reload();
  await expect(page.getByTestId('trading-shell')).toBeVisible(); // persisted session

  await page.getByTestId('sign-out').click();
  await expect(page.getByTestId('login-form')).toBeVisible();

  await page.reload();
  await expect(page.getByTestId('login-form')).toBeVisible(); // cleared session persists too
});
