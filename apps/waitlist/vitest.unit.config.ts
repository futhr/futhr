import { defineConfig } from 'vitest/config'

// The unit tests cover plain modules, so the SvelteKit plugin stays out. Its
// dependency optimizer fails on a cold cache under Vite 8, where rolldown
// cannot resolve `node:module` from its own runtime helper. The aliases mirror
// svelte.config.ts.
export default defineConfig({
  resolve: {
    alias: {
      $lib: new URL('./src/lib', import.meta.url).pathname,
      $site: new URL('../../src/lib', import.meta.url).pathname
    }
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts']
  }
})
