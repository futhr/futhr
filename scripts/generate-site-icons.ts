import { readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
// biome-ignore lint/correctness/noUnresolvedImports: re-exported from playwright by @playwright/test
import { chromium, type Page } from '@playwright/test'

const root = resolve(import.meta.dirname, '..')
const destination = join(root, 'static', 'icons')
const source = await readFile(join(root, 'src', 'lib', 'marks', 'futhr.svg'), 'utf8')

const compose = (halfSize: number, title: string): string =>
  source
    .replace(
      'viewBox="-260 -260 520 520"',
      `viewBox="-${halfSize} -${halfSize} ${halfSize * 2} ${halfSize * 2}"`
    )
    .replace('<title>Futhr / Blue Graphite / Dark / 06C Insert</title>', `<title>${title}</title>`)
    .replace('Transparent canvas and counter.', 'Ink canvas and open counter.')
    .replace(
      '  </defs>',
      `  </defs>\n  <rect x="-${halfSize}" y="-${halfSize}" width="${halfSize * 2}" height="${halfSize * 2}" fill="#1b1b1b" />`
    )

const favicon = compose(250, 'futhr:lab favicon')
const applicationIcon = compose(310, 'futhr:lab application icon')
const maskableIcon = compose(365, 'futhr:lab maskable application icon')

await Promise.all([
  writeFile(join(destination, 'favicon.svg'), favicon),
  writeFile(join(destination, 'favicon-dark.svg'), favicon),
  writeFile(join(destination, 'favicon-light.svg'), favicon),
  writeFile(join(destination, 'logo.svg'), applicationIcon)
])

const browser = await chromium.launch({ headless: true })

const render = async (page: Page, svg: string, name: string, size: number): Promise<void> => {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(
    `<style>html,body{margin:0;width:100%;height:100%}svg{display:block;width:100%;height:100%}</style>${svg}`
  )
  await page.screenshot({ path: join(destination, name) })
}

try {
  const page = await browser.newPage()
  await render(page, favicon, 'favicon-32.png', 32)
  await render(page, favicon, 'favicon-48.png', 48)
  await render(page, favicon, 'favicon-dark-32.png', 32)
  await render(page, favicon, 'favicon-dark-48.png', 48)
  await render(page, favicon, 'favicon-light-32.png', 32)
  await render(page, favicon, 'favicon-light-48.png', 48)
  await render(page, applicationIcon, 'apple-touch-icon.png', 180)
  await render(page, applicationIcon, 'logo-192.png', 192)
  await render(page, applicationIcon, 'logo-512.png', 512)
  await render(page, maskableIcon, 'logo-maskable-512.png', 512)
} finally {
  await browser.close()
}
