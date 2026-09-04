import { expect, test } from '@playwright/test'

interface StorybookIndex {
  entries: Record<string, unknown>
}

const expectedStories = [
  'brand-venture-marks--gallery',
  'brand-weekly-colours--palette',
  'layout-footer--default',
  'primitives-marker-link--default',
  'showcase-collection--disclosure-flow',
  'showcase-entry--closed',
  'showcase-entry--inverse',
  'showcase-entry--open'
]

test('serves a complete, non-indexable Storybook artifact', async ({ request }) => {
  const [manager, robots, indexResponse] = await Promise.all([
    request.get('/'),
    request.get('/robots.txt'),
    request.get('/index.json')
  ])

  expect(manager.ok()).toBe(true)
  expect(manager.headers()['x-robots-tag']).toBe('noindex, nofollow')
  expect(await robots.text()).toContain('Disallow: /')

  const index = (await indexResponse.json()) as StorybookIndex
  expect(Object.keys(index.entries)).toEqual(expect.arrayContaining(expectedStories))
})

test('renders a component story from the static preview', async ({ page }) => {
  await page.goto('/iframe.html?id=showcase-entry--open&viewMode=story')

  await expect(page.getByRole('button', { name: 'Elixir & OTP WoTEx' })).toHaveAttribute(
    'aria-expanded',
    'true'
  )
  await expect(page.getByRole('link', { name: 'GitHub organization' })).toHaveAttribute(
    'href',
    'https://github.com/wotex-project'
  )
})
