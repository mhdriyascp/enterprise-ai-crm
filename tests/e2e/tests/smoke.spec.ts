import { expect, test } from '@playwright/test';

const PUBLIC_WEB_URL = process.env.PUBLIC_WEB_URL ?? 'http://localhost:3003';
const ADMIN_WEB_URL = process.env.ADMIN_WEB_URL ?? 'http://localhost:3000';
const CRM_WEB_URL = process.env.CRM_WEB_URL ?? 'http://localhost:3002';

test.describe('public website', () => {
  test('landing page renders and exposes primary navigation', async ({ page }) => {
    await page.goto(PUBLIC_WEB_URL);
    await expect(page).toHaveTitle(/CRM/i);
    await expect(page.getByRole('link', { name: /pricing/i }).first()).toBeVisible();
  });

  test('pricing page is reachable', async ({ page }) => {
    await page.goto(PUBLIC_WEB_URL + '/pricing');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('authenticated portals redirect unauthenticated users to login', () => {
  for (const [name, url] of [
    ['admin-web', ADMIN_WEB_URL],
    ['crm-web', CRM_WEB_URL],
  ] as const) {
    test(name + ' shows a login form when unauthenticated', async ({ page }) => {
      await page.goto(url + '/login');
      await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible();
    });
  }
});
