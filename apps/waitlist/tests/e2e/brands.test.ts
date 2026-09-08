import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { brands } from '../../src/lib/brands/brands.ts'
import { hosts, origin, port } from './hosts.ts'

const imageType = /image\/(?:png|svg\+xml)/
const markLabel = (name: string) => `svg[aria-label="${name} mark"]`

const fetchJson = <T>(path: string) =>
  fetch(path).then(async (response) => ({
    status: response.status,
    body: (await response.json()) as T
  }))

for (const brand of hosts) {
  test.describe(brand.host, () => {
    test('serves its own metadata, manifest, and icons from the first paint', async ({ page }) => {
      const response = await page.goto(`${origin(brand.host)}/`)
      expect(response?.status()).toBe(200)
      await expect(page).toHaveTitle(new RegExp(`^${brand.name} — `, 'u'))
      await expect(page.locator('h1')).toHaveText(brand.name)
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        `https://${brand.host}/`
      )
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
        'content',
        `https://${brand.host}/icons/social.png`
      )
      await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
        'href',
        '/manifest.webmanifest'
      )
      await expect(page.locator(markLabel(brand.name)).first()).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Get notified' })).toBeVisible()
      await expect(page.getByText(brands[brand.id].closing)).toBeVisible()

      const manifest = await page.evaluate(
        fetchJson<{ name: string; id: string; icons: Array<{ src: string }> }>,
        '/manifest.webmanifest'
      )
      expect(manifest.status).toBe(200)
      expect(manifest.body.name).toBe(brand.name)
      expect(manifest.body.id).toBe('/')
      const statuses = await page.evaluate(
        (paths) =>
          Promise.all(
            paths.map((path) =>
              fetch(path).then((r) => [path, r.status, r.headers.get('content-type')])
            )
          ),
        [
          ...manifest.body.icons.map(({ src }) => src),
          '/icons/favicon.svg',
          '/icons/apple-touch-icon.png',
          '/icons/social.png'
        ]
      )
      for (const [path, status, type] of statuses) {
        expect(status, String(path)).toBe(200)
        expect(String(type)).toMatch(imageType)
      }
      const favicon = await page.evaluate(() => fetch('/icons/favicon.svg').then((r) => r.text()))
      expect(favicon).toContain(`<title>${brand.name}</title>`)
      const stylesheet = await page.locator('link[rel="stylesheet"]').first().getAttribute('href')
      const caching = await page.evaluate(
        (href) => fetch(href).then((r) => r.headers.get('cache-control')),
        stylesheet ?? ''
      )
      expect(caching).toContain('immutable')
    })

    test('publishes its own robots, sitemap, llms.txt, and privacy notice', async ({ page }) => {
      await page.goto(`${origin(brand.host)}/privacy`)
      await expect(page.locator('h1')).toHaveText(brand.name)
      await expect(page.getByText('Integritetsskyddsmyndigheten')).toBeVisible()
      const documents = await page.evaluate(() =>
        Promise.all(
          ['/robots.txt', '/sitemap.xml', '/llms.txt'].map((path) =>
            fetch(path).then((r) => r.text())
          )
        )
      )
      expect(documents[0]).toContain(`https://${brand.host}/sitemap.xml`)
      expect(documents[1]).toContain(`<loc>https://${brand.host}/</loc>`)
      expect(documents[2]?.startsWith(`# ${brand.name}`)).toBe(true)
      for (const other of hosts.filter((candidate) => candidate.id !== brand.id)) {
        expect(documents[2]).not.toContain(other.host)
      }
    })

    test('has no serious accessibility violations', async ({ page }) => {
      await page.goto(`${origin(brand.host)}/`)
      const results = await new AxeBuilder({ page }).analyze()
      const serious = results.violations.filter(
        ({ impact }) => impact === 'serious' || impact === 'critical'
      )
      expect(serious).toEqual([])
    })
  })
}

test('lists the local stand-ins on the loopback host and redirects www to the apex', async ({
  page
}) => {
  const index = await page.request.get(`http://127.0.0.1:${port}/`)
  expect(index.status()).toBe(200)
  const listing = await index.text()
  for (const brand of hosts) {
    expect(listing).toContain(`http://${brand.id}.localhost:${port}/`)
  }
  const unknown = await page.request.get(`http://evil.localhost:${port}/`, { maxRedirects: 0 })
  expect(unknown.status()).toBe(302)
  const location = unknown.headersArray().find((header) => header.name.toLowerCase() === 'location')
  expect(location?.value).toBe('https://futhr.io/')
  await page.goto(`${origin('www.rivure.com')}/privacy`)
  expect(page.url()).toBe(`${origin('rivure.com')}/privacy`)
  await expect(page.locator('h1')).toHaveText('Rivure')
})

test('fails closed for foreign brand paths', async ({ page }) => {
  const foreign = await page.goto(`${origin('rivure.com')}/brands/diggymon/index.html`)
  expect(foreign?.status()).toBe(404)
  await expect(page.locator('h1')).toHaveText('Rivure')
  await expect(page.getByText('Nothing here')).toBeVisible()
  const gone = await page.evaluate(() => fetch('/api/v1/subscriptions').then((r) => r.status))
  expect(gone).toBe(404)
})

test('renders the complete page and form without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto(`${origin('orvane.io')}/`)
  await expect(page.locator('h1')).toHaveText('Orvane')
  await expect(page.getByLabel('Email address')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Notify me' })).toBeEnabled()
  await expect(page.locator('svg[aria-label="Orvane mark"]').first()).toBeVisible()
  await context.close()
})

test('does not overflow a mobile viewport and animates nothing on load', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(`${origin('orvane.io')}/`)
  const widths = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
    animations: document.getAnimations().length
  }))
  expect(widths.document).toBeLessThanOrEqual(widths.viewport)
  expect(widths.animations).toBe(0)
})
