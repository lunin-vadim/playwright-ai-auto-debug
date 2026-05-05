import { test, expect } from '@playwright/test';

const BASE = 'https://playwright.dev';

// ──────────────────────────────────────────────
// PASSING — correct selectors and assertions
// ──────────────────────────────────────────────

test('homepage title is correct', async ({ page }) => {
  await page.goto(BASE);
  await expect(page).toHaveTitle(/Playwright/);
});

test('docs link navigates to docs', async ({ page }) => {
  await page.goto(BASE);
  await page.getByRole('link', { name: 'Docs' }).first().click();
  await expect(page).toHaveURL(/\/docs/);
});

test('search button is visible', async ({ page }) => {
  await page.goto(BASE);
  await expect(page.getByRole('button', { name: /search/i })).toBeVisible();
});

// ──────────────────────────────────────────────
// FAILING — realistic developer mistakes
// ──────────────────────────────────────────────

test('homepage has welcome heading', async ({ page }) => {
  await page.goto(BASE);
  // wrong text — actual heading is different
  await expect(
    page.getByRole('heading', { name: 'Welcome to our platform' })
  ).toBeVisible();
});

test('login button is clickable', async ({ page }) => {
  await page.goto(BASE);
  // wrong selector — no login button on playwright.dev
  await page.locator('.login-button').click();
});

test('page title matches brand name', async ({ page }) => {
  await page.goto(BASE);
  // wrong expected value
  await expect(page).toHaveTitle('Best Testing Framework Ever');
});

test('pricing page loads', async ({ page }) => {
  // page does not exist on playwright.dev
  await page.goto(`${BASE}/pricing`);
  await expect(page.getByRole('heading', { name: 'Pricing' })).toBeVisible();
});

test('newsletter signup works', async ({ page }) => {
  await page.goto(BASE);
  // newsletter form does not exist on playwright.dev
  await page.getByRole('textbox', { name: 'Email' }).fill('user@example.com');
  await page.getByRole('button', { name: 'Subscribe' }).click();
  await expect(page.getByText('Thank you for subscribing!')).toBeVisible();
});
