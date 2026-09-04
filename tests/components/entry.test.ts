import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import Entry from '$lib/components/entry.svelte'
import type { ShowcaseEntry } from '$lib/types/showcase-entry'

const item: ShowcaseEntry = {
  order: 1,
  slug: 'example',
  group: 'Example',
  title: 'Example project',
  lede: 'A component-level interaction fixture.',
  repositories: ['futhr/example'],
  links: [{ label: 'Repository', href: 'https://example.com/repository' }],
  body: 'Markdown source.',
  bodyHtml: '<p>Rendered project detail.</p>'
}

test('exposes disclosure state and delegates interaction', async () => {
  const onToggle = vi.fn()
  const screen = await render(Entry, {
    item,
    index: 0,
    isOpen: false,
    divider: true,
    onToggle
  })
  const button = screen.getByRole('button', { name: 'Example Example project' })
  const panel = screen.container.querySelector('#showcase-panel-example')

  await expect.element(button).toHaveAttribute('aria-expanded', 'false')
  expect(panel?.getAttribute('aria-hidden')).toBe('true')
  expect(panel?.hasAttribute('inert')).toBe(true)
  await button.click()
  expect(onToggle).toHaveBeenCalledOnce()

  await screen.rerender({
    item,
    index: 0,
    isOpen: true,
    divider: true,
    onToggle
  })

  await expect.element(button).toHaveAttribute('aria-expanded', 'true')
  expect(panel?.getAttribute('aria-hidden')).toBe('false')
  expect(panel?.hasAttribute('inert')).toBe(false)
  await expect.element(screen.getByText('Rendered project detail.')).toBeVisible()
  await expect
    .element(screen.getByRole('link', { name: 'Repository' }))
    .toHaveAttribute('rel', 'noopener noreferrer')
})
