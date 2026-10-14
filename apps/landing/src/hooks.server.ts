import { env } from 'cloudflare:workers'
import type { Handle } from '@sveltejs/kit/hooks'
import { applyHeaders } from '#lib/headers.ts'
import { resolveHost } from '#lib/resolve-host.ts'
import { dev } from '$app/env'

export const handle: Handle = async ({ event, resolve }) => {
  const local = dev || (env && 'LANDING_LOCAL' in env && env.LANDING_LOCAL === 'true')
  const resolved = resolveHost(event.url.hostname, Boolean(local))
  if (!resolved) {
    return applyHeaders(new Response(null, { status: 404 }))
  }
  event.locals.project = resolved.project
  // Leave edge/browser caching to the outer Worker gate.
  const response = applyHeaders(await resolve(event), 'no-store')
  if (!resolved.project.indexed || response.status >= 400) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }
  return response
}
