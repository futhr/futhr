import type { Handle, HandleServerError } from '@sveltejs/kit'
import { brands } from '$lib/brands/brands'
import { controller } from '$lib/brands/controller'
import { brandForHost } from '$lib/brands/host'
import { apexForWww } from '$lib/brands/www'
import { applyHeaders } from '$lib/server/headers'

type Kind = Parameters<typeof applyHeaders>[1]['kind']

const permanentRedirect = 308
const temporaryRedirect = 302
const firstErrorStatus = 400
const notFound = 404
const loopback = new Set(['localhost', '127.0.0.1', '[::1]'])

/**
 * A `www` hostname goes to its apex with scheme, port, path, and query kept;
 * any other unknown hostname goes to the portfolio. Nothing is served either way.
 */
const redirectAway = (url: URL): Response => {
  const apex = apexForWww(url.hostname)
  const target = new URL(url.href)
  if (apex) {
    target.hostname = apex.host
  }
  return new Response(null, {
    status: apex ? permanentRedirect : temporaryRedirect,
    headers: { location: apex ? target.href : controller.parent.url }
  })
}

/**
 * A workstation has no venture hostname, so the bare loopback address lists the
 * local stand-ins instead of sending the developer to futhr.io. A deployed
 * Worker never receives a loopback host.
 */
const localIndex = (url: URL): Response => {
  const port = url.port ? `:${url.port}` : ''
  const links = Object.values(brands)
    .map(
      (brand) =>
        `<li><a href="${url.protocol}//${brand.id}.localhost${port}/">${brand.name}</a></li>`
    )
    .join('')
  const body = `<!doctype html><meta charset="utf-8"><title>Waitlist, local</title><h1>Waitlist, local</h1><p>Each brand answers on its own hostname. These stand-ins resolve to this machine in Chrome and Firefox; Safari needs the real hostnames in /etc/hosts.</p><ul>${links}</ul>`
  return new Response(body, { headers: { 'content-type': 'text/html; charset=utf-8' } })
}

const kindFor = (routeId: string | null, status: number): Kind => {
  if (status >= firstErrorStatus) {
    return 'error'
  }
  if (routeId?.endsWith('/icons/[file=icon]')) {
    return 'icon'
  }
  if (routeId?.endsWith('/[document=document]')) {
    return 'document'
  }
  return 'page'
}

/**
 * Resolves the brand from the hostname before any route runs, then applies the
 * header policy to whatever comes back. The response is copied because headers
 * on a fetched asset are immutable.
 */
export const handle: Handle = async ({ event, resolve }) => {
  const secure = event.url.protocol === 'https:'
  const brand = brandForHost(event.url.hostname)
  if (!brand) {
    if (loopback.has(event.url.hostname)) {
      return localIndex(event.url)
    }
    const response = redirectAway(event.url)
    applyHeaders(response.headers, { kind: 'redirect', secure })
    return response
  }
  event.locals.brand = brand
  const resolved = await resolve(event)
  const response = new Response(resolved.body, {
    status: resolved.status,
    headers: new Headers(resolved.headers)
  })
  applyHeaders(response.headers, { kind: kindFor(event.route.id, response.status), secure })
  return response
}

/** Unknown paths are routine on a public host; only real failures reach the log. */
export const handleError: HandleServerError = ({ status, message }) => {
  if (status !== notFound) {
    console.error('request failed', status)
  }
  return { message }
}
