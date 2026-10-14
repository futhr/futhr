import { cloudflareTest } from '@cloudflare/vitest-plugin'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [cloudflareTest({ wrangler: { configPath: './wrangler.toml' } })],
  test: {
    // Workerd loads transformed modules through the runner, not Node's disk cache.
    fsModuleCache: false,
    include: ['tests/workers/**/*.test.ts']
  }
})
