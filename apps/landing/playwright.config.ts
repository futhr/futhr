import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: true,
  retries: 1,
  reporter: 'list',
  use: { trace: 'retain-on-failure' },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } }
    },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } }
  ],
  webServer: {
    command:
      'pnpm build && pnpm exec wrangler dev --env local --ip 127.0.0.1 --port 24176 --persist-to test-results/worker-state --log-level error',
    port: 24_176,
    reuseExistingServer: false,
    timeout: 180_000
  }
})
