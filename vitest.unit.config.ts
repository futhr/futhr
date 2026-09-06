import { configDefaults, defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      css: { include: [/site\.css/] },
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov'],
        include: ['src/lib/*.ts', 'src/lib/config/**/*.ts', 'src/lib/server/**/*.ts'],
        reportsDirectory: 'coverage/unit',
        thresholds: {
          statements: 95,
          branches: 90,
          functions: 100,
          lines: 95
        }
      },
      exclude: [
        ...configDefaults.exclude,
        'tests/components/**',
        'tests/e2e/**',
        'tests/storybook-e2e/**',
        'apps/**'
      ]
    }
  })
)
