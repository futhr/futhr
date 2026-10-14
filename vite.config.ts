import adapter from '@sveltejs/adapter-static'
import { sveltekit } from '@sveltejs/kit/vite'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'

const generatorHeaders = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self' blob:; frame-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'; manifest-src 'self'",
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), geolocation=(), microphone=(), payment=(), usb=()',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff'
}

const exkPasswdHeaders = (): Plugin => ({
  name: 'exk-passwd-headers',
  configureServer(server) {
    server.middlewares.use((request, response, next) => {
      if (request.url?.startsWith('/exk-passwd/')) {
        for (const [name, value] of Object.entries(generatorHeaders)) {
          response.setHeader(name, value)
        }
      }
      next()
    })
  },
  configurePreviewServer(server) {
    server.middlewares.use((request, response, next) => {
      if (request.url?.startsWith('/exk-passwd/')) {
        for (const [name, value] of Object.entries(generatorHeaders)) {
          response.setHeader(name, value)
        }
      }
      next()
    })
  }
})

export default defineConfig({
  resolve: { alias: { $site: new URL('./src/lib', import.meta.url).pathname } },
  plugins: [
    exkPasswdHeaders(),
    tailwindcss(),
    sveltekit({
      preprocess: vitePreprocess(),
      adapter: adapter({ fallback: '404.html' }),
      prerender: { crawl: false },
      // The single stylesheet is about 6 KB gzipped; inlining it removes the only
      // render-blocking request on the critical path.
      inlineStyleThreshold: 32 * 1024
    })
  ]
})
