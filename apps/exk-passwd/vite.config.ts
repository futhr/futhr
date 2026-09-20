// biome-ignore lint/correctness/noNodejsModules: Vite runs this config in Node and serves attested development assets byte-for-byte.
import { readFile } from 'node:fs/promises'
import { defineConfig } from 'vite'

const contentSecurityPolicy =
  "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self' blob:; frame-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'; manifest-src 'self'"

const isolationHeaders = {
  'Content-Security-Policy': contentSecurityPolicy,
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), geolocation=(), microphone=(), payment=(), usb=()',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff'
}

const developmentHeaders = {
  ...isolationHeaders,
  'Content-Security-Policy': contentSecurityPolicy.replace(
    "style-src 'self'",
    "style-src 'self' 'unsafe-inline'"
  )
}

const developmentCoreAssets = new Map<string, readonly [path: string, contentType: string]>([
  ['/browser-core/manifest.json', ['browser-core/manifest.json', 'application/json']],
  ['/browser-core/core/AtomVM.mjs', ['browser-core/core/AtomVM.mjs', 'text/javascript']],
  ['/browser-core/core/AtomVM.wasm', ['browser-core/core/AtomVM.wasm', 'application/wasm']],
  [
    '/browser-core/core/exk_passwd.avm',
    ['browser-core/core/exk_passwd.avm', 'application/octet-stream']
  ]
])

export default defineConfig({
  base: './',
  plugins: [
    {
      name: 'exk-passwd-development-runtime',
      apply: 'serve',
      configureServer(server) {
        server.middlewares.use(async (request, response, next) => {
          const { pathname } = new URL(request.url ?? '/', 'http://localhost')
          if (pathname === '/runtime-entry.mjs') {
            request.url = '/src/runtime-entry.ts'
            next()
            return
          }

          const asset = developmentCoreAssets.get(pathname)
          if (!asset) {
            next()
            return
          }

          const [path, contentType] = asset
          try {
            response.statusCode = 200
            for (const [name, value] of Object.entries(isolationHeaders)) {
              response.setHeader(name, value)
            }
            response.setHeader('Content-Type', contentType)
            response.end(await readFile(new URL(path, import.meta.url)))
          } catch (error) {
            next(error as Error)
          }
        })
      }
    }
  ],
  publicDir: 'static',
  build: {
    rollupOptions: {
      input: {
        index: new URL('index.html', import.meta.url).pathname,
        runtime: new URL('src/runtime-entry.ts', import.meta.url).pathname
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === 'runtime' ? 'runtime-entry.mjs' : 'assets/[name]-[hash].js'
      }
    }
  },
  preview: {
    headers: isolationHeaders
  },
  server: {
    headers: developmentHeaders
  }
})
