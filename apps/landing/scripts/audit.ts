import { Resolver, resolve4 } from 'node:dns/promises'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import AxeBuilder from '@axe-core/playwright'
// biome-ignore lint/correctness/noUnresolvedImports: re-exported by @playwright/test
import { chromium } from '@playwright/test'
import { projects } from '../src/lib/projects.ts'

const directory =
  process.env.LANDING_AUDIT_DIR ?? fileURLToPath(new URL('../test-results/audit', import.meta.url))
const live = process.argv.includes('--live')
const authoritativeDns = process.argv.includes('--authoritative-dns')
if (authoritativeDns && !live) {
  throw new Error('--authoritative-dns requires --live')
}
const resolver = new Resolver()
const nameserver = 'brenda.ns.cloudflare.com'
const addresses: { host: string; address: string }[] = []
if (authoritativeDns) {
  // These zones share this assigned nameserver. Bypass a stale local DNS cache
  // without changing system DNS or disabling browser certificate verification.
  resolver.setServers(await resolve4(nameserver))
  for (const project of Object.values(projects)) {
    const [address] = await resolver.resolve4(project.host)
    if (!address) {
      throw new Error(`No authoritative A record for ${project.host}`)
    }
    addresses.push({ host: project.host, address })
  }
}
const source = live
  ? `Live HTTPS domains${authoritativeDns ? ' via authoritative DNS (local cache bypassed)' : ''}`
  : 'Local production builds; not deployed'
const views = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 414, height: 896 }
] as const
await mkdir(directory, { recursive: true })
const browser = await chromium.launch({
  args:
    addresses.length > 0
      ? [
          `--host-resolver-rules=${addresses.map(({ host, address }) => `MAP ${host} ${address}`).join(', ')}`
        ]
      : []
})

const measureGeometry = () => {
  const selectors = [
    '.landing-composition',
    '.landing-mark',
    'h1',
    '.landing-statement',
    '.landing-description',
    '.landing-relationship',
    '.landing-destination'
  ]
  return selectors.flatMap((selector) => {
    const node = document.querySelector(selector)
    if (!node) {
      return []
    }
    const r = node.getBoundingClientRect()
    const style = getComputedStyle(node)
    return [
      {
        selector,
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        fontSize: style.fontSize,
        lineHeight: style.lineHeight
      }
    ]
  })
}

try {
  const pages = await Promise.all(
    Object.values(projects).flatMap((project) =>
      views.map(async (view) => {
        const context = await browser.newContext({
          viewport: { width: view.width, height: view.height },
          deviceScaleFactor: 1
        })
        const page = await context.newPage()
        const requests: string[] = []
        page.on('request', (request) => requests.push(request.url()))
        const url = live ? `https://${project.host}/` : `http://${project.id}.localhost:24176/`
        const response = await page.goto(url)
        if (response?.status() !== 200) {
          throw new Error(`Landing returned ${response?.status()}: ${url}`)
        }
        await page.evaluate(() => document.fonts.ready)
        const styled = await page.evaluate(
          () =>
            getComputedStyle(document.querySelector('.landing-upper') as Element).display === 'grid'
        )
        if (!styled) {
          throw new Error('Landing stylesheet did not load; do not accept this capture')
        }
        const geometry = await page.evaluate(measureGeometry)
        const file = `${project.id}-${view.width}.png`
        await page.screenshot({ path: join(directory, file), fullPage: true })
        const accessibility = await new AxeBuilder({ page }).analyze()
        const measurements = await page.evaluate(() => ({
          width: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          height: innerHeight,
          scrollHeight: document.documentElement.scrollHeight,
          scripts: document.scripts.length,
          forms: document.forms.length
        }))
        if (
          accessibility.violations.length > 0 ||
          measurements.scrollWidth > measurements.width ||
          measurements.scripts > 0 ||
          measurements.forms > 0 ||
          requests.some((request) => new URL(request).origin !== new URL(url).origin)
        ) {
          throw new Error(`Landing audit failed: ${url} at ${view.width}px`)
        }
        const result = {
          project: project.id,
          view: view.name,
          file,
          url,
          status: response?.status(),
          geometry,
          measurements,
          accessibilityViolations: accessibility.violations.map(({ id }) => id),
          requests
        }
        await context.close()
        return result
      })
    )
  )
  const showcase = await Promise.all(
    views.map(async (view) => {
      const context = await browser.newContext({
        viewport: { width: view.width, height: view.height },
        deviceScaleFactor: 1,
        reducedMotion: 'reduce'
      })
      const page = await context.newPage()
      await page.goto(live ? 'https://futhr.io/' : 'http://127.0.0.1:24177/')
      await page.evaluate(() => document.fonts.ready)
      await page.getByRole('button', { name: 'Recetas', exact: true }).click()
      await page.locator('#showcase-row-recetas').scrollIntoViewIfNeeded()
      await page.screenshot({ path: join(directory, `showcase-recetas-${view.width}.png`) })
      const footer = page.locator('footer')
      await footer.scrollIntoViewIfNeeded()
      const marks = await footer.locator('svg[aria-label$=" mark"]').evaluateAll((elements) =>
        elements.map((element) => {
          const r = element.getBoundingClientRect()
          return {
            name: element.getAttribute('aria-label'),
            width: r.width,
            height: r.height,
            x: r.x,
            y: r.y
          }
        })
      )
      await footer.screenshot({ path: join(directory, `footer-${view.width}.png`) })
      await context.close()
      return { width: view.width, marks }
    })
  )
  await writeFile(
    join(directory, 'measurements.json'),
    `${JSON.stringify({ source, capturedAt: new Date().toISOString(), dns: { mode: authoritativeDns ? 'authoritative override' : 'system', nameserver: authoritativeDns ? nameserver : null, addresses }, reference: { canvas: [1280, 640], innerWidth: 1112, mark: { x: 84, y: 104, width: 246 }, title: { x: 456, y: 64, fontSize: 96 }, note: 'Landing composition uses the same two-column grid and cap-height rhythm, scaled into a centered 1240px frame. WoTEx statement wraps deliberately. Recetas uses the same complete copy and relationship rhythm as the other projects. Footer retains prior mark order and adds Recetas eighth.' }, pages, showcase }, null, 2)}\n`
  )
  const gallery = pages
    .map(
      (page) =>
        `<article><h2>${page.project} · ${page.view}</h2><a href="${page.file}"><img src="${page.file}" alt="${page.project} ${page.view} landing"></a></article>`
    )
    .join('')
  await writeFile(
    join(directory, 'index.html'),
    `<!doctype html><html lang="en"><meta charset="utf-8"><title>Project landings audit</title><style>body{background:#1b1b1b;color:#dcdbd6;font:16px system-ui;margin:32px}main{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}img{max-width:100%;max-height:700px}a{color:inherit}</style><h1>${source}</h1><p>Desktop 1440×900 and mobile 414×896. Read-only captures; this script changes no deployment or DNS.</p><p><a href="measurements.json">Measurements and accessibility results</a></p><main>${gallery}</main></html>`
  )
} finally {
  await browser.close()
}
