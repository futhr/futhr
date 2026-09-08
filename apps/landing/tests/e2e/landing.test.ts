import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { projects } from '../../src/lib/projects.ts'

for (const project of Object.values(projects)) {
  test(`${project.name}: responsive, accessible and self-contained`, async ({ page }, info) => {
    const requests: string[] = []
    page.on('request', (request) => requests.push(request.url()))
    await page.goto(`http://${project.id}.localhost:24176/`)
    await page.evaluate(() => document.fonts.ready)
    await expect(page.getByRole('heading', { level: 1, name: project.name })).toBeVisible()
    await expect(page.locator('script, form, iframe')).toHaveCount(0)
    expect(requests.every((url) => new URL(url).hostname === `${project.id}.localhost`)).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
    if (project.link) {
      await page.keyboard.press('Tab')
      await expect(page.getByRole('link', { name: project.link.label })).toBeFocused()
    }
    const bounds = await page.locator('.landing-composition').boundingBox()
    expect(bounds).not.toBeNull()
    if (info.project.name === 'chromium' && bounds) {
      expect(Math.abs(bounds.x + bounds.width / 2 - 720)).toBeLessThan(1)
      expect(Math.abs(bounds.y + bounds.height / 2 - 450)).toBeLessThan(1)
    }
    await page.screenshot({ path: info.outputPath(`${project.id}.png`), fullPage: true })
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%'
    })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}
