import adapter from '@sveltejs/adapter-cloudflare'
import type { Config } from '@sveltejs/kit'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

const config: Config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({ config: 'wrangler.build.toml' }),
    alias: { $site: '../../src/lib' },
    inlineStyleThreshold: 0,
    csp: {
      mode: 'hash',
      directives: {
        'default-src': ['none'],
        'base-uri': ['none'],
        'form-action': ['none'],
        'frame-ancestors': ['none'],
        'style-src': ['self'],
        'img-src': ['self'],
        'font-src': ['self'],
        'manifest-src': ['self']
      }
    }
  }
}

export default config
