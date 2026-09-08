const policy =
  "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; style-src 'self'; img-src 'self'; font-src 'self'; manifest-src 'self'"

const applyHeaders = (response: Response, cache = 'public, max-age=3600'): Response => {
  const headers = new Headers(response.headers)
  headers.set('Content-Security-Policy', policy)
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('Referrer-Policy', 'no-referrer')
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()')
  headers.set('Cache-Control', response.status >= 400 ? 'no-store' : cache)
  // All six HTTPS hostnames were verified at cutover on 8 September 2026.
  // Do not extend this policy to unrelated or mail subdomains.
  headers.set('Strict-Transport-Security', 'max-age=31536000')
  return new Response(response.body, { status: response.status, headers })
}

export { applyHeaders }
