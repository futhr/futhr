import adapter from '@sveltejs/adapter-cloudflare'
import { sveltekit } from '@sveltejs/kit/vite'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: { alias: { $site: new URL('../../src/lib', import.meta.url).pathname } },
  plugins: [
    tailwindcss(),
    sveltekit({
      preprocess: vitePreprocess(),
      adapter: adapter({ config: 'wrangler.build.toml' }),
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
    })
  ]
})
