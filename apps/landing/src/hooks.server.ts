import type { Handle } from '@sveltejs/kit'
import { dev } from '$app/environment'
import { applyHeaders } from '$lib/headers'
import { resolveHost } from '$lib/resolve-host'

export const handle: Handle = async ({ event, resolve }) => {
  const env = event.platform?.env
  const local = dev || (env && 'LANDING_LOCAL' in env && env.LANDING_LOCAL === 'true')
  const resolved = resolveHost(event.url.hostname, Boolean(local))
  if (!resolved) {
    return applyHeaders(new Response(null, { status: 404 }))
  }
  event.locals.project = resolved.project
  // The adapter caches responses internally when given a public cache policy.
  // Leave edge/browser caching to the outer gate, so rebuilt HTML cannot outlive
  // its stylesheet in the adapter's independent Cache API layer.
  const response = applyHeaders(await resolve(event), 'no-store')
  if (!resolved.project.indexed || response.status >= 400) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }
  return response
}
