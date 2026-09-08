import app from '../.svelte-kit/cloudflare/app.js'
import { assetFiles } from './lib/asset-files'
import { applyHeaders } from './lib/headers'
import { resolveHost } from './lib/resolve-host'

const pages = new Set(['/', '/robots.txt', '/sitemap.xml', '/manifest.webmanifest'])

/** This gate runs before adapter asset serving, including on www and unknown hosts. */
const worker = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const local = 'LANDING_LOCAL' in env && env.LANDING_LOCAL === 'true'
    const resolved = resolveHost(url.hostname, local)
    if (!resolved) {
      return applyHeaders(new Response(null, { status: 404 }))
    }
    if (resolved.redirect || (!local && url.protocol === 'http:')) {
      const target = new URL(url)
      target.protocol = 'https:'
      target.host = resolved.project.host
      target.port = ''
      return applyHeaders(new Response(null, { status: 308, headers: { location: target.href } }))
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return applyHeaders(new Response(null, { status: 405, headers: { allow: 'GET, HEAD' } }))
    }
    if (assetFiles.has(url.pathname.slice(1))) {
      url.pathname = `/projects/${resolved.project.id}${url.pathname}`
      return applyHeaders(
        await env.ASSETS.fetch(new Request(url, request)),
        'public, max-age=86400'
      )
    }
    const immutable =
      url.pathname.startsWith('/_app/immutable/') &&
      (url.pathname.endsWith('.css') || url.pathname.endsWith('.woff2'))
    if (immutable) {
      return applyHeaders(await env.ASSETS.fetch(request), 'public, max-age=31536000, immutable')
    }
    // Prevent direct access to internal assets or client/data routes. The application
    // renders its branded 404 for all remaining unknown paths.
    if (!pages.has(url.pathname)) {
      url.pathname = '/not-found'
      return applyHeaders(await app.fetch(new Request(url, request), env, ctx))
    }
    return applyHeaders(await app.fetch(request, env, ctx))
  }
} satisfies ExportedHandler<Env>

export default worker
