import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3000)
// Prefer localhost over 127.0.0.1 so Next.js Dev Assets are not cross-origin-blocked.
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`
const isCI = !!process.env.CI

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  outputDir: 'test-results',
  use: {
    baseURL: BASE_URL,
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // CI builds first so `next start` serves a production bundle.
    command: isCI
      ? `npm run build && npm run start -- --hostname localhost --port ${PORT}`
      : `npm run dev -- --hostname localhost --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !isCI,
    timeout: 300_000,
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: '1',
    },
  },
})
