import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for the Enterprise AI CRM end-to-end tests.
 *
 * Target URLs can be overridden via environment variables so the same suite
 * runs locally (docker compose) and against ephemeral/CI environments:
 *   - ADMIN_WEB_URL   (default http://localhost:3000)
 *   - CRM_WEB_URL     (default http://localhost:3002)
 *   - PUBLIC_WEB_URL  (default http://localhost:3003)
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
