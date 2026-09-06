type ResponseKind = 'page' | 'document' | 'icon' | 'redirect' | 'error'

interface HeaderInput {
  readonly kind: ResponseKind
  readonly secure: boolean
}

const yearSeconds = 31_536_000
const daySeconds = 86_400
const hourSeconds = 3600

const cacheControl: Readonly<Record<ResponseKind, string>> = {
  page: 'no-cache',
  document: `public, max-age=${hourSeconds}`,
  icon: `public, max-age=${daySeconds}`,
  // Never cached: a browser that stored a redirect keeps replaying it after the
  // hostname starts answering, which is exactly what local development hits.
  redirect: 'no-store',
  error: 'no-store'
}

const closedPolicy = "default-src 'none'; frame-ancestors 'none'"

/**
 * Security headers for every Worker response. SvelteKit sets the nonce policy
 * on HTML pages from svelte.config.ts; any response without a policy gets a
 * closed one here. Static assets are covered by static/_headers instead.
 */
const applyHeaders = (headers: Headers, { kind, secure }: HeaderInput): Headers => {
  if (!headers.has('Content-Security-Policy')) {
    headers.set('Content-Security-Policy', closedPolicy)
  }
  // same-origin, not no-referrer: under no-referrer a browser sends Origin: null
  // on a native form post and SvelteKit's CSRF check refuses it.
  headers.set('Referrer-Policy', 'same-origin')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')
  headers.set(
    'Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
  )
  headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  headers.set('Cross-Origin-Resource-Policy', kind === 'icon' ? 'cross-origin' : 'same-origin')
  headers.set('Cache-Control', cacheControl[kind])
  if (kind === 'error') {
    headers.set('X-Robots-Tag', 'noindex, nofollow')
  }
  if (secure) {
    headers.set('Strict-Transport-Security', `max-age=${yearSeconds}; includeSubDomains`)
  }
  return headers
}

export { applyHeaders }
