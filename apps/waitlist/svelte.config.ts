import adapter from '@sveltejs/adapter-cloudflare'
import type { Config } from '@sveltejs/kit'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

const config: Config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    alias: { $site: '../../src/lib' },
    // The nonce policy for HTML pages, first-party only. src/hooks.server.ts
    // closes every other response, and _headers covers the asset layer.
    csp: {
      mode: 'nonce',
      directives: {
        'default-src': ['none'],
        'base-uri': ['none'],
        'form-action': ['self'],
        'frame-ancestors': ['none'],
        'script-src': ['self'],
        'style-src': ['self'],
        'img-src': ['self'],
        'font-src': ['self'],
        'connect-src': ['self'],
        'manifest-src': ['self'],
        'object-src': ['none']
      }
    }
  }
}

export default config
