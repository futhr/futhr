import { defineConfig, devices } from '@playwright/test'

const webCryptoContract = '**/webcrypto.test.ts'

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  forbidOnly: true,
  retries: 1,
  reporter: 'list',
  timeout: 90_000,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4191',
    trace: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: webCryptoContract,
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'webkit',
      testIgnore: webCryptoContract,
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'chromium-webcrypto',
      testMatch: webCryptoContract,
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: 'pnpm build && pnpm preview --port 4191 --base /exk-passwd/',
    reuseExistingServer: false,
    timeout: 180_000,
    url: 'http://127.0.0.1:4191/exk-passwd/'
  }
})
