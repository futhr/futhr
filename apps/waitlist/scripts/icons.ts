import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
// biome-ignore lint/correctness/noUnresolvedImports: re-exported from playwright by @playwright/test
import { type Browser, chromium } from '@playwright/test'
import { brands } from '../src/lib/brands/brands.ts'
import { composeIcon } from '../src/lib/brands/icons.ts'
import type { Brand } from '../src/lib/types/brand.ts'

/**
 * Regenerates every brand icon and social image from the mark components.
 * Run after a mark changes and commit the output under static/brands/. The
 * SVGs are deterministic text; the PNGs are Chromium renders of the same
 * markup so browsers and icon files agree pixel for pixel.
 */
const root = fileURLToPath(new URL('..', import.meta.url))
const logos = join(root, '..', '..', 'src', 'lib', 'components', 'logos')
const fontFile = join(
  root,
  'node_modules',
  '@fontsource-variable',
  'archivo',
  'files',
  'archivo-latin-wght-normal.woff2'
)
const ink = '#1b1b1b'
const paper = '#dcdbd6'
const muted = '#9a9a94'
const social = { width: 1200, height: 630 }

const pngRenders = [
  ['favicon-32.png', 'rounded', 32],
  ['favicon-48.png', 'rounded', 48],
  ['icon-192.png', 'rounded', 192],
  ['icon-512.png', 'rounded', 512],
  ['apple-touch-icon.png', 'square', 180],
  ['icon-maskable-512.png', 'maskable', 512]
] as const

const socialMarkup = (brand: Brand, mark: string, fontData: string) => `<!doctype html>
<html><head><meta charset="utf-8"><style>
  @font-face { font-family: Archivo; src: url(data:font/woff2;base64,${fontData}) format("woff2"); font-weight: 100 900; }
  html, body { margin: 0; }
  body { width: ${social.width}px; height: ${social.height}px; background: ${ink}; color: ${paper}; font-family: Archivo, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
  .card { box-sizing: border-box; height: 100%; padding: 72px; display: grid; grid-template-columns: 240px 1fr; grid-template-rows: 1fr auto; column-gap: 72px; }
  .mark { width: 240px; color: ${paper}; --mark-contrast: ${ink}; }
  .mark svg { display: block; width: 100%; height: auto; }
  h1 { margin: -0.08em 0 0; font-size: 128px; line-height: 0.85; font-weight: 900; letter-spacing: -0.04em; }
  p { margin: 28px 0 0; max-width: 20em; font-size: 38px; line-height: 1.25; font-weight: 500; letter-spacing: -0.015em; text-wrap: balance; }
  .host { grid-column: 1 / -1; align-self: end; font-size: 28px; font-weight: 700; color: ${muted}; letter-spacing: 0.04em; text-transform: uppercase; }
</style></head>
<body><div class="card"><div class="mark">${mark}</div><div><h1>${brand.name}</h1><p>${brand.lede}</p></div><div class="host">${brand.host} · waitlist</div></div></body></html>`

const iconMarkup = (svg: string, size: number) =>
  `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style></head><body>${svg}</body></html>`

const renderPng = async (
  browser: Browser,
  markup: string,
  path: string,
  size: { width: number; height: number }
) => {
  const page = await browser.newPage({ viewport: size, deviceScaleFactor: 1 })
  await page.setContent(markup)
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path, omitBackground: true, type: 'png' })
  await page.close()
}

const renderBrand = async (browser: Browser, brand: Brand, fontData: string) => {
  const markSource = await readFile(join(logos, `${brand.id}.svelte`), 'utf8')
  const directory = join(root, 'static', 'brands', brand.id, 'icons')
  await mkdir(directory, { recursive: true })
  const svgs = {
    rounded: composeIcon({ markSource, title: brand.name, shape: 'rounded' }),
    square: composeIcon({ markSource, title: brand.name, shape: 'square' }),
    maskable: composeIcon({ markSource, title: brand.name, shape: 'maskable' })
  }
  await Promise.all([
    writeFile(join(directory, 'favicon.svg'), svgs.rounded),
    writeFile(
      join(directory, 'icon.svg'),
      composeIcon({ markSource, title: `${brand.name} icon`, shape: 'rounded' })
    ),
    ...pngRenders.map(([file, shape, size]) =>
      renderPng(browser, iconMarkup(svgs[shape], size), join(directory, file), {
        width: size,
        height: size
      })
    ),
    renderPng(
      browser,
      socialMarkup(brand, markSource, fontData),
      join(directory, 'social.png'),
      social
    )
  ])
}

const launched = await chromium.launch()
try {
  const archivo = (await readFile(fontFile)).toString('base64')
  await Promise.all(Object.values(brands).map((brand) => renderBrand(launched, brand, archivo)))
} finally {
  await launched.close()
}
