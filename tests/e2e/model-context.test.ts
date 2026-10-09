import { expect, test } from '@playwright/test'

test.use({ launchOptions: { args: ['--enable-features=WebMCP'] } })

test('exposes the portfolio through native WebMCP tools', async ({ page }) => {
  await page.goto('/')
  await expect
    .poll(async () => (await page.webmcp.tools()).map(({ name }) => name).sort())
    .toEqual(['get-entry', 'list-work', 'open-entry'])

  const listed = (await page.webmcp.callTool('list-work')) as ModelContextToolResult
  const items = JSON.parse(listed.content[0]?.text ?? '[]') as Array<{ slug: string }>
  expect(items).toHaveLength(14)
  expect(items.some(({ slug }) => slug === 'ex-maude')).toBe(true)

  const entry = (await page.webmcp.callTool('get-entry', {
    slug: 'sigil-guard'
  })) as ModelContextToolResult
  expect(entry.content[0]?.text).toContain('# SigilGuard')
  await expect(page.locator('#showcase-row-thesis button')).toHaveAttribute('aria-expanded', 'true')

  await page.webmcp.callTool('open-entry', { slug: 'sigil-guard' })
  await expect(page.locator('#showcase-row-sigil-guard button')).toHaveAttribute(
    'aria-expanded',
    'true'
  )
  await expect(page.locator('#showcase-row-thesis button')).toHaveAttribute(
    'aria-expanded',
    'false'
  )
})
