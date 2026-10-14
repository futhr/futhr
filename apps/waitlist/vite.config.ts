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
      adapter: adapter(),
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
    })
  ]
})
