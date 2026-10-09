import { readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
// biome-ignore lint/correctness/noUnresolvedImports: re-exported from playwright by @playwright/test
import { chromium, type Page } from '@playwright/test'

const root = resolve(import.meta.dirname, '..')
const destination = join(root, 'static', 'icons')
const source = await readFile(join(root, 'src', 'lib', 'marks', 'futhr.svg'), 'utf8')

const ink = '#1b1b1b'
const paper = '#dcdbd6'
const frame = (halfSize: number, title: string): string =>
  source
    .replace(
      'viewBox="-260 -260 520 520"',
      `viewBox="-${halfSize} -${halfSize} ${halfSize * 2} ${halfSize * 2}"`
    )
    .replace('<title>Futhr</title>', `<title>${title}</title>`)

/** Opaque app icon: the paper glyph on its own ink square. */
const composeOpaque = (halfSize: number, title: string): string =>
  frame(halfSize, title)
    .replace('transparent canvas', 'ink canvas')
    .replace(
      '  <path',
      `  <rect x="-${halfSize}" y="-${halfSize}" width="${halfSize * 2}" height="${halfSize * 2}" fill="${ink}" />\n  <path`
    )

/** Transparent favicon in one colour, for the scheme-specific links. */
const composeGlyph = (halfSize: number, title: string, fill: string): string =>
  frame(halfSize, title).replace(`fill="${paper}"`, `fill="${fill}"`)

/** Transparent favicon that follows the tab strip's colour scheme itself. */
const composeAdaptive = (halfSize: number, title: string): string =>
  composeGlyph(halfSize, title, 'currentColor').replace(
    '  <path',
    `  <style>\n    svg {\n      color: ${ink};\n    }\n    @media (prefers-color-scheme: dark) {\n      svg {\n        color: ${paper};\n      }\n    }\n  </style>\n  <path`
  )

const faviconHalf = 236
const favicon = composeAdaptive(faviconHalf, 'futhr:lab favicon')
const faviconLight = composeGlyph(faviconHalf, 'futhr:lab favicon for a light tab strip', ink)
const faviconDark = composeGlyph(faviconHalf, 'futhr:lab favicon for a dark tab strip', paper)
const faviconFallback = composeOpaque(250, 'futhr:lab favicon')
const applicationIcon = composeOpaque(310, 'futhr:lab application icon')
const maskableIcon = composeOpaque(365, 'futhr:lab maskable application icon')

await Promise.all([
  writeFile(join(destination, 'favicon.svg'), favicon),
  writeFile(join(destination, 'favicon-dark.svg'), faviconDark),
  writeFile(join(destination, 'favicon-light.svg'), faviconLight),
  writeFile(join(destination, 'logo.svg'), applicationIcon)
])

const browser = await chromium.launch({ headless: true })

/** Icons without their own background rect render on a transparent canvas. */
const render = async (page: Page, svg: string, name: string, size: number): Promise<void> => {
  const transparent = !svg.includes('<rect')
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(
    `<style>html,body{margin:0;width:100%;height:100%;background:transparent}svg{display:block;width:100%;height:100%}</style>${svg}`
  )
  await page.screenshot({ path: join(destination, name), omitBackground: transparent })
}

try {
  const page = await browser.newPage()
  await render(page, faviconFallback, 'favicon-32.png', 32)
  await render(page, faviconFallback, 'favicon-48.png', 48)
  await render(page, faviconDark, 'favicon-dark-32.png', 32)
  await render(page, faviconDark, 'favicon-dark-48.png', 48)
  await render(page, faviconLight, 'favicon-light-32.png', 32)
  await render(page, faviconLight, 'favicon-light-48.png', 48)
  await render(page, applicationIcon, 'apple-touch-icon.png', 180)
  await render(page, applicationIcon, 'logo-192.png', 192)
  await render(page, applicationIcon, 'logo-512.png', 512)
  await render(page, maskableIcon, 'logo-maskable-512.png', 512)
} finally {
  await browser.close()
}
