import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const appPath = '/exk-passwd/'
const entropyPattern = /\d+\.\d bits/
type BrowserPage = ConstructorParameters<typeof AxeBuilder>[0]['page']

const generatedPassword = async (page: BrowserPage) => {
  await expect(page.locator('#feedback')).toHaveText(
    'Generated only on this device. Never sent over the network.',
    {
      timeout: 45_000
    }
  )
  const password = (await page.locator('#password').textContent()) ?? ''
  expect(password.length).toBeGreaterThan(10)
  return password
}

test('boots the real core, generates locally, and exposes audited runtime identity', async ({
  page
}) => {
  const consoleMessages: string[] = []
  const pageErrors: string[] = []
  const requests: string[] = []
  page.on('console', (message) => consoleMessages.push(message.text()))
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('request', (request) => requests.push(request.url()))

  const response = await page.goto(appPath)
  expect(response?.headers()).toMatchObject({
    'cross-origin-embedder-policy': 'require-corp',
    'cross-origin-opener-policy': 'same-origin',
    'cross-origin-resource-policy': 'same-origin'
  })
  expect(response?.headers()['content-security-policy']).toContain(
    "script-src 'self' 'wasm-unsafe-eval'"
  )
  await expect(page.locator('#chromium-extension-link')).toHaveAttribute(
    'aria-label',
    'Install ExkPasswd for Chrome'
  )
  await expect(page.locator('#chromium-extension-link')).toHaveAttribute(
    'href',
    'https://chromewebstore.google.com/search/ExkPasswd'
  )

  const password = await generatedPassword(page)
  await expect(page.locator('#runtime-status')).toHaveText('Elixir ready · offline capable')
  await expect(page.locator('#runtime-info')).toContainText('v0.3.2')
  await expect(page.locator('#runtime-info')).toContainText('Web Crypto getRandomValues')
  await expect(page.locator('#runtime-info')).toContainText('Cross-origin isolated')
  await expect(page.locator('#seen-entropy')).toHaveText(entropyPattern)
  await expect(page.locator('#blind-entropy')).toHaveText(entropyPattern)
  await expect(page.getByRole('link', { name: 'ExkPasswd repository on GitHub' })).toHaveAttribute(
    'href',
    'https://github.com/futhr/exk_passwd'
  )
  await expect(page.getByRole('link', { name: 'Read the architecture' })).toHaveCount(0)

  const panels = await page.evaluate(() => {
    const technical = document.querySelector<HTMLElement>('#technical')
    const footer = document.querySelector<HTMLElement>('footer')
    return {
      documentHeight: document.documentElement.scrollHeight,
      technicalBottom: technical?.getBoundingClientRect().bottom ?? 0,
      footerBottom: footer?.getBoundingClientRect().bottom ?? 0,
      viewportHeight: globalThis.innerHeight
    }
  })
  expect(panels.technicalBottom).toBeLessThanOrEqual(panels.viewportHeight)
  expect(panels.footerBottom).toBeLessThanOrEqual(panels.viewportHeight)
  expect(Math.abs(panels.documentHeight - panels.viewportHeight)).toBeLessThanOrEqual(2)
  await expect(page.locator('.scroll-cue')).toHaveCount(0)

  expect(consoleMessages).toEqual([])
  expect(pageErrors).toEqual([])
  expect(requests.every((url) => new URL(url).origin === 'http://127.0.0.1:4191')).toBe(true)
  expect(requests.some((url) => url.includes(password))).toBe(false)

  const persisted = await page.evaluate(async () => ({
    local: Object.values(localStorage),
    session: Object.values(sessionStorage),
    databases: typeof indexedDB.databases === 'function' ? await indexedDB.databases() : []
  }))
  expect(JSON.stringify(persisted)).not.toContain(password)
})

test('matches the native deterministic generation and entropy vector', async ({
  browserName,
  context,
  page
}) => {
  // biome-ignore lint/suspicious/noSkippedTests: only Chromium exposes module-worker requests for deterministic byte injection.
  test.skip(
    browserName !== 'chromium',
    'Only Chromium exposes module-worker requests to Playwright routing for byte injection.'
  )
  const runtimeSource = await readFile(
    new URL('../../browser-core/core/AtomVM.mjs', import.meta.url),
    'utf8'
  )
  const deterministicRuntime = `let exkPasswdConformanceCounter = 0
Object.defineProperty(Crypto.prototype, 'getRandomValues', {
  configurable: true,
  value(bytes) {
    for (let index = 0; index < bytes.byteLength; index += 1) {
      bytes[index] = exkPasswdConformanceCounter % 256
      exkPasswdConformanceCounter += 1
    }
    return bytes
  }
})
${runtimeSource}`
  const runtimeHash = createHash('sha256').update(deterministicRuntime).digest('hex')

  await context.route('**/browser-core/core/AtomVM.mjs', async (route) => {
    const response = await route.fetch()
    await route.fulfill({ response, body: deterministicRuntime })
  })
  await context.route('**/browser-core/manifest.json', async (route) => {
    const response = await route.fetch()
    const manifest = (await response.json()) as {
      files: Record<string, { bytes: number; sha256: string }>
    }
    manifest.files['core/AtomVM.mjs'] = {
      bytes: Buffer.byteLength(deterministicRuntime),
      sha256: runtimeHash
    }
    await route.fulfill({ response, json: manifest })
  })

  await page.goto(appPath)
  await expect(page.locator('#feedback')).toHaveText(
    'Generated only on this device. Never sent over the network.',
    {
      timeout: 45_000
    }
  )
  await expect(page.locator('#password')).toHaveText('++07!most!EVOKE!think!08++')
  await expect(page.locator('#seen-entropy')).toHaveText('59.4 bits')
  await expect(page.locator('#blind-entropy')).toHaveText('170.8 bits')
})

test('supports every option, regeneration, and copy', async ({ browserName, context, page }) => {
  if (browserName === 'chromium') {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  } else {
    await page.addInitScript(() => {
      let copied = ''
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          readText: async () => copied,
          writeText: (value: string) => {
            copied = value
            return Promise.resolve()
          }
        }
      })
    })
  }
  await page.goto(appPath)
  const first = await generatedPassword(page)
  const initialFormWidth = await page
    .locator('#settings')
    .evaluate((element) => element.clientWidth)
  const labelSizes = await page
    .locator('#settings')
    .evaluate((element) =>
      [...element.querySelectorAll<HTMLElement>('label > span, .select-field > span')].map(
        (label) => getComputedStyle(label).fontSize
      )
    )
  expect(new Set(labelSizes).size).toBe(1)

  const presetTrigger = page.locator('#preset-trigger')
  await expect(presetTrigger).toBeVisible()
  await presetTrigger.click()
  await expect(presetTrigger).toHaveAttribute('aria-expanded', 'true')
  await page.locator('#preset-options [role="option"]', { hasText: 'xkcd' }).click()
  await expect(presetTrigger).toHaveAttribute('aria-expanded', 'false')
  await expect(presetTrigger).toContainText('xkcd')
  await expect(page.locator('#feedback')).toHaveText(
    'Generated only on this device. Never sent over the network.',
    {
      timeout: 30_000
    }
  )
  const xkcd = (await page.locator('#password').textContent()) ?? ''
  expect(xkcd).not.toBe(first)
  expect(xkcd.split('-')).toHaveLength(5)

  await page.locator('#num-words').fill('4')
  await expect(page.locator('.option-grid')).toBeVisible()
  await page.locator('#digits-before').fill('1')
  await page.locator('#digits-after').fill('1')
  await page.locator('#settings').evaluate((form: HTMLFormElement) => form.requestSubmit())
  await expect(page.locator('#feedback')).toHaveText(
    'Generated only on this device. Never sent over the network.',
    {
      timeout: 30_000
    }
  )
  const customized = (await page.locator('#password').textContent()) ?? ''
  expect(customized).not.toBe(xkcd)
  expect(await page.locator('#settings').evaluate((element) => element.clientWidth)).toBe(
    initialFormWidth
  )

  await page.locator('#copy').click()
  await expect(page.locator('#feedback')).toContainText('Copied.')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(customized)
})

test('fails closed when Web Crypto is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Crypto.prototype, 'getRandomValues', {
      configurable: true,
      value: undefined
    })
  })

  await page.goto(appPath)
  await expect(page.locator('#runtime-status')).toHaveText('Runtime unavailable')
  await expect(page.locator('#fatal-error')).toContainText('Web Crypto is required')
  await expect(page.locator('#password')).toHaveText('—')
})

test('remains usable offline and cold boots the Chromium PWA cache', async ({
  browserName,
  context,
  page
}) => {
  await page.goto(appPath)
  await generatedPassword(page)
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  expect(await page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true)
  const cachedUrls = await page.evaluate(async () => {
    const keys = await caches.keys()
    const requests = await Promise.all(keys.map(async (key) => (await caches.open(key)).keys()))
    return requests.flat().map((request) => request.url)
  })
  expect(cachedUrls.some((url) => url.endsWith('/browser-core/core/AtomVM.mjs'))).toBe(true)

  await context.setOffline(true)
  if (browserName === 'chromium') {
    await page.reload()
    await generatedPassword(page)
  }
  const previous = (await page.locator('#password').textContent()) ?? ''
  await page.locator('#regenerate').click()
  await expect(page.locator('#password')).not.toHaveText(previous)
  await expect(page.locator('#feedback')).toHaveText(
    'Generated only on this device. Never sent over the network.'
  )
  await expect(page.locator('#runtime-status')).toHaveText('Elixir ready · offline capable')
})

test('has no automatically detectable accessibility violations', async ({ page }) => {
  await page.goto(appPath)
  await generatedPassword(page)
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})
