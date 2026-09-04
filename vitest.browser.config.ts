import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/lib/components/**/*.svelte'],
      reportsDirectory: 'coverage/components',
      thresholds: {
        statements: 95,
        branches: 80,
        functions: 95,
        lines: 95
      }
    },
    include: ['tests/components/**/*.test.ts'],
    setupFiles: ['./tests/components/setup.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }]
    }
  }
})
