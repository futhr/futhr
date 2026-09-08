import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
// biome-ignore lint/correctness/noUnresolvedImports: re-exported by @playwright/test
import { chromium } from '@playwright/test'
import { projects } from '../src/lib/projects.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const viewBoxPattern = /viewBox="([^"]+)"/
const sizes = [
  ['favicon-48.png', 48],
  ['apple-touch-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512]
] as const
const font = (
  await readFile(
    join(root, 'node_modules/@fontsource-variable/archivo/files/archivo-latin-wght-normal.woff2')
  )
).toString('base64')
const browser = await chromium.launch()

try {
  await Promise.all(
    Object.values(projects).map(async (project) => {
      const mark = await readFile(
        join(root, `../../src/lib/components/logos/${project.id}.svelte`),
        'utf8'
      )
      if (!viewBoxPattern.test(mark)) {
        throw new Error('Logo viewBox missing')
      }
      const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img"><title>${project.name}</title><rect width="512" height="512" fill="#1b1b1b"/><g color="#dcdbd6" style="--mark-contrast:#1b1b1b">${mark.replace('<svg ', '<svg x="92" y="92" width="328" height="328" ')}</g></svg>`
      const destination = join(root, `static/projects/${project.id}`)
      await mkdir(destination, { recursive: true })
      await writeFile(join(destination, 'favicon.svg'), icon)
      await Promise.all(
        sizes.map(async ([name, size]) => {
          const page = await browser.newPage({
            viewport: { width: size, height: size },
            deviceScaleFactor: 1
          })
          await page.setContent(
            `<style>html,body{margin:0}body>svg{display:block;width:100%;height:100%}</style>${icon}`
          )
          await page.screenshot({ path: join(destination, name) })
          await page.close()
        })
      )
      const page = await browser.newPage({
        viewport: { width: 1200, height: 630 },
        deviceScaleFactor: 1
      })
      await page.setContent(
        `<style>@font-face{font-family:Archivo;src:url(data:font/woff2;base64,${font});font-weight:100 900}*{box-sizing:border-box}html,body{margin:0;background:#1b1b1b;color:#dcdbd6;font-family:Archivo}.mark{position:absolute;left:79px;top:105px;width:231px}.mark svg{width:100%;height:auto}h1{position:absolute;left:427px;top:63px;margin:0;font-size:90px;line-height:1.12;font-weight:850;letter-spacing:-4.7px}p{position:absolute;left:427px;top:230px;margin:0;width:680px;font-size:32px;line-height:1.25}.host{position:absolute;left:79px;top:537px;font-size:24px;font-weight:650;letter-spacing:1px;color:#999a92}</style><div class="mark">${mark}</div><h1>${project.name}</h1>${project.statement ? `<p>${project.statement}</p>` : ''}<div class="host">${project.host.toUpperCase()}</div>`
      )
      await page.evaluate(() => document.fonts.ready)
      await page.screenshot({ path: join(destination, 'social.png') })
      await page.close()
    })
  )
} finally {
  await browser.close()
}
