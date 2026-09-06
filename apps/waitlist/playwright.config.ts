import { defineConfig, devices } from '@playwright/test'
import { localSecrets } from './tests/local-secrets.ts'

const port = 51_825
const hosts = [
  'rivure.com',
  'www.rivure.com',
  'diggymon.com',
  'refpath.io',
  'reloved.eco',
  'orvane.io'
]

// Chromium resolves the five venture hostnames to the local Worker, so pages
// load from their real hosts and the Worker's exact-host routing is exercised.
const resolverRules = hosts.map((host) => `MAP ${host} 127.0.0.1`).join(', ')

// Local-only values, mirrored in .dev.vars.example. Wrangler's --var flags take
// precedence over [vars] and .dev.vars, so CI needs no secret files.
const vars = {
  WAITLIST_ENVIRONMENT: 'test',
  EMAIL_KEY_VERSION: localSecrets.EMAIL_KEY_VERSION,
  EMAIL_KEY_V1: localSecrets.EMAIL_KEY_V1,
  EMAIL_DIGEST_KEY: localSecrets.EMAIL_DIGEST_KEY
}
const varFlags = Object.entries(vars)
  .map(([key, value]) => `--var ${key}:${value}`)
  .join(' ')

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: true,
  retries: 1,
  reporter: 'list',
  use: {
    trace: 'retain-on-failure',
    launchOptions: { args: [`--host-resolver-rules=${resolverRules}`] }
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] }
    }
  ],
  webServer: {
    command: `pnpm build && pnpm exec wrangler d1 migrations apply waitlist --local --env local --persist-to .wrangler/e2e && pnpm exec wrangler dev --env local --ip 127.0.0.1 --port ${port} --persist-to .wrangler/e2e --log-level error ${varFlags}`,
    port,
    reuseExistingServer: false,
    timeout: 180_000
  }
})
