import { SELF } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'
import { projects } from '../../src/lib/projects.ts'

const clientScript = /<script\b/i
const stylesheet = /href="([^"]+\.css)"/

describe('production Worker', () => {
  it.each(Object.values(projects))(
    'serves $host as script-free, isolated HTML',
    async (project) => {
      const response = await SELF.fetch(`https://${project.host}/`)
      expect(response.status).toBe(200)
      const html = await response.text()
      expect(html).toContain(`<title>${project.name}</title>`)
      expect(html).toContain(`rel="canonical" href="https://${project.host}/"`)
      expect(html).not.toMatch(clientScript)
      expect(html).not.toContain('<form')
      expect(html).not.toContain('waitlist')
      expect(html).not.toContain('coming soon')
      expect(response.headers.get('content-security-policy')).toContain("default-src 'none'")
      expect(response.headers.get('cache-control')).toBe('public, max-age=3600')
      expect(response.headers.get('set-cookie')).toBeNull()
      expect(response.headers.get('strict-transport-security')).toBe('max-age=31536000')
      const css = stylesheet.exec(html)?.[1]
      expect(css).toBeTruthy()
      const style = await SELF.fetch(new URL(css ?? '', `https://${project.host}/`).href)
      expect(style.status).toBe(200)
      expect(style.headers.get('content-type')).toContain('text/css')
      expect(style.headers.get('cache-control')).toBe('public, max-age=31536000, immutable')
      const robots = await (await SELF.fetch(`https://${project.host}/robots.txt`)).text()
      const sitemap = await (await SELF.fetch(`https://${project.host}/sitemap.xml`)).text()
      if (project.indexed) {
        expect(robots).toContain(`https://${project.host}/sitemap.xml`)
        expect(sitemap).toContain(`<loc>https://${project.host}/</loc>`)
      } else {
        expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow')
        expect(robots).toContain('Disallow: /')
        expect(sitemap).not.toContain('<loc>')
      }
      const manifest = await SELF.fetch(`https://${project.host}/manifest.webmanifest`)
      expect(await manifest.json()).toMatchObject({ name: project.name })
      for (const asset of [
        'favicon.svg',
        'favicon-48.png',
        'apple-touch-icon.png',
        'icon-192.png',
        'icon-512.png',
        'social.png'
      ]) {
        const icon = await SELF.fetch(`https://${project.host}/${asset}`)
        expect(icon.status, asset).toBe(200)
        expect(icon.headers.get('cache-control')).toBe('public, max-age=86400')
      }
      const head = await SELF.fetch(`https://${project.host}/`, { method: 'HEAD' })
      expect(head.status).toBe(200)
      expect(await head.text()).toBe('')
      expect((await SELF.fetch(`https://${project.host}/`, { method: 'POST' })).status).toBe(405)
    }
  )

  it.each(Object.values(projects))(
    'upgrades HTTP on $host without relying on zone settings',
    async (project) => {
      const response = await SELF.fetch(`http://${project.host}/docs/a?x=1&y=2`, {
        redirect: 'manual'
      })
      expect(response.status).toBe(308)
      expect(response.headers.get('location')).toBe(`https://${project.host}/docs/a?x=1&y=2`)
    }
  )

  it.each(Object.values(projects))(
    'redirects www.$host with path and query intact, even for assets',
    async (project) => {
      for (const protocol of ['http', 'https']) {
        for (const path of ['/docs/a?x=1&y=2', '/favicon.svg']) {
          const response = await SELF.fetch(`${protocol}://www.${project.host}${path}`, {
            redirect: 'manual'
          })
          expect(response.status).toBe(308)
          expect(response.headers.get('location')).toBe(`https://${project.host}${path}`)
        }
      }
    }
  )

  it.each([
    'example.com',
    'recetas.co.com.evil.example',
    'www.example.com',
    'reloved.localhost',
    'localhost',
    '127.0.0.1'
  ])('fails closed on %s including static assets', async (host) => {
    for (const path of [
      '/',
      '/favicon.svg',
      '/projects/reloved/favicon.svg',
      '/projects%2freloved/favicon.svg',
      '/app.js',
      '/_app/version.json'
    ]) {
      expect((await SELF.fetch(`https://${host}${path}`)).status).toBe(404)
    }
  })

  it.each([
    '/docs',
    '/index.html',
    '/projects/reloved/favicon.svg',
    '/projects%2freloved/favicon.svg',
    '/app.js',
    '/_app/version.json',
    '/__data.json',
    '/withdraw',
    '/privacy'
  ])('returns branded 404 for %s', async (path) => {
    const response = await SELF.fetch(`https://wotex.io${path}`)
    expect(response.status).toBe(404)
    expect(response.headers.get('cache-control')).toBe('no-store')
    const html = await response.text()
    expect(html).toContain('Nothing here.')
    expect(html).toContain('wotex.io')
    expect(html).not.toMatch(clientScript)
  })
})
