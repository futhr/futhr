import { describe, expect, it } from 'vitest'
import { applyHeaders } from '../../src/lib/server/headers.ts'

describe('applyHeaders', () => {
  it('keeps the page policy SvelteKit set and closes any response without one', () => {
    const page = applyHeaders(new Headers({ 'Content-Security-Policy': "script-src 'nonce-x'" }), {
      kind: 'page',
      secure: true
    })
    expect(page.get('Content-Security-Policy')).toBe("script-src 'nonce-x'")
    expect(page.get('Referrer-Policy')).toBe('same-origin')
    expect(page.get('X-Content-Type-Options')).toBe('nosniff')
    expect(page.get('X-Frame-Options')).toBe('DENY')
    expect(page.get('Strict-Transport-Security')).toBe('max-age=31536000')
    expect(page.get('Cache-Control')).toBe('no-cache')
    expect(page.get('X-Robots-Tag')).toBeNull()

    const failed = applyHeaders(new Headers(), { kind: 'error', secure: false })
    expect(failed.get('Content-Security-Policy')).toBe("default-src 'none'; frame-ancestors 'none'")
    expect(failed.get('Cache-Control')).toBe('no-store')
    expect(failed.get('X-Robots-Tag')).toBe('noindex, nofollow')
    expect(failed.get('Strict-Transport-Security')).toBeNull()
  })

  it('caches documents for an hour, icons for a day cross-origin, and redirects never', () => {
    const document = applyHeaders(new Headers(), { kind: 'document', secure: true })
    expect(document.get('Cache-Control')).toBe('public, max-age=3600')
    expect(document.get('Cross-Origin-Resource-Policy')).toBe('same-origin')
    const icon = applyHeaders(new Headers(), { kind: 'icon', secure: true })
    expect(icon.get('Cache-Control')).toBe('public, max-age=86400')
    expect(icon.get('Cross-Origin-Resource-Policy')).toBe('cross-origin')
    const redirect = applyHeaders(new Headers(), { kind: 'redirect', secure: true })
    expect(redirect.get('Cache-Control')).toBe('no-store')
  })
})
