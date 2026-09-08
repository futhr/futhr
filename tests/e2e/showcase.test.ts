import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const archivoLatinAsset = /archivo-latin-wght-normal.*\.woff2/
const faviconAsset = /\/icons\/favicon\.svg$/

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('prerenders every ordered showcase section and metadata', async ({ page }) => {
  await expect(page).toHaveTitle('futhr — trust, interoperability, unit economics.')
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    'A capital-efficient portfolio of platforms and open infrastructure for domains where software decisions carry operational, financial, or legal consequences.'
  )
  await expect(page.locator('section[aria-label="Selected work"] article')).toHaveCount(21)
  const firstEntry = page.locator('#showcase-row-thesis')
  await expect(firstEntry.locator('button')).toHaveAttribute('aria-expanded', 'true')
  await expect(firstEntry).toHaveCSS('background-color', 'rgb(27, 27, 27)')
  await expect(firstEntry).toHaveCSS('color', 'rgb(220, 219, 214)')
  await expect(page.getByRole('button', { name: 'NUIF' })).toBeVisible()
})

test('aligns the open ingress with its headline on desktop', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium')

  const entry = page.locator('#showcase-row-thesis')
  const headline = entry.locator('button span').nth(1)
  const ingress = entry.locator('p').first()
  const headlineLeft = await headline.evaluate((element) => {
    const bounds = element.getBoundingClientRect()
    const padding = Number.parseFloat(getComputedStyle(element).paddingLeft)
    return bounds.left + padding
  })
  const ingressLeft = await ingress.evaluate((element) => element.getBoundingClientRect().left)

  expect(Math.abs(headlineLeft - ingressLeft)).toBeLessThan(1)
})

test('keeps exactly one disclosure open and exposes its content', async ({ page }) => {
  const thesis = page.locator('#showcase-row-thesis button')
  const sigilGuard = page.getByRole('button', { name: 'SigilGuard' })

  await sigilGuard.click()

  await expect(sigilGuard).toHaveAttribute('aria-expanded', 'true')
  await expect(thesis).toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('#showcase-panel-sigil-guard')).toHaveAttribute('aria-hidden', 'false')
  await expect(page.getByText('The in-process security runtime', { exact: false })).toBeVisible()

  await sigilGuard.press('Enter')
  await expect(sigilGuard).toHaveAttribute('aria-expanded', 'false')
})

test('honours reduced-motion preferences', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const row = page.locator('#showcase-row-sigil-guard')
  await page.getByRole('button', { name: 'SigilGuard' }).click()

  await expect(row).toHaveAttribute('data-state', 'open')
  expect(await row.evaluate((element) => element.getAnimations().length)).toBe(0)
})

test('has no serious automated accessibility violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze()
  const seriousViolations = results.violations.filter(
    ({ impact }) => impact === 'serious' || impact === 'critical'
  )

  expect(seriousViolations).toEqual([])
})

test('publishes install metadata, loadable icons and the primary font preload', async ({
  page,
  request
}) => {
  const preloads = page.locator('link[rel="preload"][as="font"]')
  await expect(preloads).toHaveCount(2)
  await expect(preloads.first()).toHaveAttribute('href', archivoLatinAsset)
  await expect(preloads.first()).toHaveAttribute('type', 'font/woff2')

  const favicon = page.locator('link[rel="icon"][type="image/svg+xml"]')
  await expect(favicon).toHaveAttribute('href', faviconAsset)
  await expect(page.locator('link[rel="icon"]')).toHaveCount(2)
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#1b1b1b')
  await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(27, 27, 27)')

  const faviconResponse = await request.get('/icons/favicon.svg')
  expect(faviconResponse.ok()).toBe(true)
  const faviconSource = await faviconResponse.text()
  expect(faviconSource).toContain('<rect')
  expect(faviconSource).not.toContain('prefers-color-scheme')

  const manifestResponse = await request.get('/manifest.webmanifest')
  expect(manifestResponse.ok()).toBe(true)

  const manifest = (await manifestResponse.json()) as {
    id: string
    display: string
    icons: Array<{ src: string }>
  }
  expect(manifest.id).toBe('/')
  expect(manifest.display).toBe('standalone')
  expect(manifest.icons).toHaveLength(4)

  const iconResponses = await Promise.all(manifest.icons.map(({ src }) => request.get(src)))
  for (const response of iconResponses) {
    expect(response.ok()).toBe(true)
  }

  const [llmsResponse, robotsResponse, sitemapResponse] = await Promise.all([
    request.get('/llms.txt'),
    request.get('/robots.txt'),
    request.get('/sitemap.xml')
  ])
  expect(llmsResponse.ok()).toBe(true)
  expect(await llmsResponse.text()).toContain('https://futhr.io/')
  expect(robotsResponse.ok()).toBe(true)
  expect(await robotsResponse.text()).toContain('https://futhr.io/sitemap.xml')
  expect(sitemapResponse.ok()).toBe(true)
  expect(await sitemapResponse.text()).toContain('<loc>https://futhr.io/</loc>')
})

test('does not overflow a mobile viewport', async ({ page }) => {
  const widths = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    viewport: window.innerWidth
  }))

  expect(widths.document).toBeLessThanOrEqual(widths.viewport)
})

test('serves the prerendered page offline after service-worker installation', async ({
  context,
  page
}) => {
  await page.evaluate(async () => navigator.serviceWorker?.ready)
  await page.reload()
  await context.setOffline(true)
  await page.reload()

  await expect(
    page.getByRole('heading', { name: 'futhr:lab — selected work and research' })
  ).toBeAttached()
})

test('preserves other applications caches when a service worker activates', async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()
  await context.route('**/service-worker.js', async (route) => {
    await page.evaluate(async () => {
      const cache = await caches.open('another-app')
      await cache.put('/retained', new Response('keep'))
    })
    await route.continue()
  })
  await page.goto(test.info().project.use.baseURL ?? '')
  await page.evaluate(() => navigator.serviceWorker.ready)
  expect(await page.evaluate(() => caches.has('another-app'))).toBe(true)
  await context.close()
})
