import { describe, expect, it } from 'vitest'
import { brands } from '../../../src/lib/brands/brands.ts'
import { environment } from '../environment.ts'
import { helpers } from './helpers.ts'

const { call } = helpers
const hosts = Object.values(brands).map(({ host }) => host)
const noncePattern = /'nonce-([^']+)'/

describe('host routing', () => {
  it.each(hosts)('serves %s its own page, documents, and icons', async (host) => {
    const brand = Object.values(brands).find((candidate) => candidate.host === host)
    if (!brand) {
      throw new Error('unknown host in test table')
    }
    const page = await call(`https://${host}/`)
    expect(page.status).toBe(200)
    expect(page.headers.get('content-type')).toContain('text/html')
    const html = await page.text()
    expect(html).toContain(`<title>${brand.title}</title>`)
    expect(html).toContain(`rel="canonical" href="https://${host}/"`)
    expect(html).toContain(`>${brand.name}</h1>`)
    expect(html).toContain('id="join-form-email"')
    expect(html).not.toContain('challenges.cloudflare.com')
    expect(html).toContain(brand.closing)
    const nonce = noncePattern.exec(page.headers.get('content-security-policy') ?? '')?.[1]
    expect(nonce).toBeTruthy()
    expect(html).toContain(`nonce="${nonce}"`)
    for (const other of Object.values(brands).filter((candidate) => candidate.id !== brand.id)) {
      expect(html).not.toContain(other.host)
      expect(html).not.toContain(other.lede)
    }

    const manifest = await call(`https://${host}/manifest.webmanifest`)
    expect(manifest.status).toBe(200)
    expect(manifest.headers.get('content-type')).toContain('application/manifest+json')
    expect(((await manifest.json()) as { name: string }).name).toBe(brand.name)

    const favicon = await call(`https://${host}/icons/favicon.svg`)
    expect(favicon.status).toBe(200)
    expect(favicon.headers.get('content-type')).toContain('svg')
    expect(favicon.headers.get('cross-origin-resource-policy')).toBe('cross-origin')
    expect(favicon.headers.get('cache-control')).toBe('public, max-age=86400')
    expect(await favicon.text()).toContain(`<title>${brand.name}</title>`)

    const social = await call(`https://${host}/icons/social.png`)
    expect(social.status).toBe(200)
    expect(social.headers.get('content-type')).toContain('image/png')

    expect(await (await call(`https://${host}/robots.txt`)).text()).toContain(
      `https://${host}/sitemap.xml`
    )
    expect(await (await call(`https://${host}/llms.txt`)).text()).toContain(`# ${brand.name}`)
    const privacy = await call(`https://${host}/privacy`)
    expect(privacy.status).toBe(200)
    const privacyHtml = await privacy.text()
    expect(privacyHtml).toContain('is the controller for personal data collected on')
    expect(privacyHtml).not.toContain('futhr:lab')
    expect(privacyHtml).not.toContain('https://futhr.io')
    expect(privacyHtml).toContain(`rel="canonical" href="https://${host}/privacy"`)
  })

  it('redirects www hostnames to their apex with path and query intact', async () => {
    const www = await call('https://www.rivure.com/privacy?x=1', { redirect: 'manual' })
    expect(www.status).toBe(308)
    expect(www.headers.get('location')).toBe('https://rivure.com/privacy?x=1')
    expect(www.headers.get('cache-control')).toBe('no-store')
    const local = await call('http://WWW.Orvane.io:8787/privacy', { redirect: 'manual' })
    expect(local.status).toBe(308)
    expect(local.headers.get('location')).toBe('http://orvane.io:8787/privacy')
  })

  it('redirects both Orvane alias hostnames to the canonical HTTPS origin', async () => {
    for (const host of ['orvane.ai', 'www.orvane.ai']) {
      const response = await call(`http://${host}:8787/privacy?x=1`, { redirect: 'manual' })
      expect(response.status).toBe(308)
      expect(response.headers.get('location')).toBe('https://orvane.io/privacy?x=1')
      expect(response.headers.get('cache-control')).toBe('no-store')
      expect(await response.text()).toBe('')
    }
  })

  it('serves a brand on its .localhost stand-in and lists them on the bare loopback host', async () => {
    const page = await call('http://rivure.localhost:8787/')
    expect(page.status).toBe(200)
    expect(await page.text()).toContain(`<title>${brands.rivure.title}</title>`)
    const index = await call('http://127.0.0.1:8787/')
    expect(index.status).toBe(200)
    const html = await index.text()
    for (const brand of Object.values(brands)) {
      expect(html).toContain(`href="http://${brand.id}.localhost:8787/"`)
    }
    expect((await call('http://evil.localhost:8787/', { redirect: 'manual' })).status).toBe(302)
  })

  it('sends every other hostname to the portfolio without serving anything', async () => {
    for (const host of [
      'futhr.io',
      'rivure.com.evil.example',
      'www.example.com',
      'reloved.eco',
      'www.reloved.eco'
    ]) {
      const response = await call(`https://${host}/anything?x=1`, { redirect: 'manual' })
      expect(response.status, host).toBe(302)
      expect(response.headers.get('location')).toBe('https://futhr.io/')
      expect(await response.text()).toBe('')
    }
    const post = await call('https://futhr.io/api/v1/subscriptions', {
      method: 'POST',
      redirect: 'manual'
    })
    expect(post.status).toBe(302)
    expect(post.headers.get('x-content-type-options')).toBe('nosniff')
  })

  it('fails closed for unknown paths and never serves another brand by path', async () => {
    for (const path of [
      '/brands/diggymon',
      '/brands/rivure',
      '/index.html',
      '/assets/missing.js',
      '/icons/missing.png',
      '/icons/../index.html',
      '/api/v1/subscriptions',
      '/api/v2/anything',
      '/confirm',
      '/unsubscribe'
    ]) {
      const response = await call(`https://rivure.com${path}`)
      expect(response.status, path).toBe(404)
      expect(response.headers.get('cache-control'), path).toBe('no-store')
    }
    const page = await call('https://rivure.com/nothing-here')
    expect(page.status).toBe(404)
    const html = await page.text()
    expect(html).toContain('Nothing here')
    expect(html).toContain('rivure.com')
    expect(html).toContain('name="robots" content="noindex, nofollow"')
    expect(html).not.toContain('diggymon')
  })

  it('rejects unexpected methods with 405', async () => {
    expect((await call('https://rivure.com/privacy', { method: 'POST' })).status).toBe(405)
    expect((await call('https://rivure.com/privacy', { method: 'PUT' })).status).toBe(405)
    expect((await call('https://rivure.com/', { method: 'PUT' })).status).toBe(405)
  })

  it('answers HEAD with headers and no body', async () => {
    const response = await call('https://orvane.io/', { method: 'HEAD' })
    expect(response.status).toBe(200)
    expect(response.headers.get('content-security-policy')).toContain('nonce-')
    expect(await response.text()).toBe('')
  })

  it('sets security headers on every response class', async () => {
    const page = await call('https://orvane.io/')
    expect(page.headers.get('referrer-policy')).toBe('same-origin')
    expect(page.headers.get('x-content-type-options')).toBe('nosniff')
    expect(page.headers.get('x-frame-options')).toBe('DENY')
    expect(page.headers.get('cache-control')).toBe('no-cache')
    expect(page.headers.get('strict-transport-security')).toContain('max-age=31536000')
    expect(page.headers.get('content-security-policy')).toContain("frame-ancestors 'none'")
    expect(page.headers.get('content-security-policy')).not.toContain('cloudflare.com')
    expect(page.headers.get('content-security-policy')).not.toContain('unsafe-inline')
    const plain = await call('http://orvane.io/')
    expect(plain.headers.get('strict-transport-security')).toBeNull()
    const document = await call('https://orvane.io/llms.txt')
    expect(document.headers.get('cache-control')).toBe('public, max-age=3600')
    expect(document.headers.get('content-security-policy')).toBe(
      "default-src 'none'; frame-ancestors 'none'"
    )
  })
})

it('applies icon cache and resource headers at the static asset layer', async () => {
  const response = await environment.ASSETS.fetch(
    'https://rivure.com/brands/rivure/icons/favicon.svg'
  )
  expect(response.status).toBe(200)
  expect(response.headers.get('cross-origin-resource-policy')).toBe('cross-origin')
  expect(response.headers.get('cache-control')).toBe('public, max-age=86400')
})
