import { defineConfig, devices } from '@playwright/test'

const port = 51_824

export default defineConfig({
  testDir: './tests/storybook-e2e',
  fullyParallel: true,
  forbidOnly: true,
  retries: 1,
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: `pnpm storybook:build && pnpm exec wrangler dev --config wrangler.storybook.toml --ip 127.0.0.1 --port ${port} --log-level error`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 120_000
  }
})
