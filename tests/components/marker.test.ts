import { createRawSnippet } from 'svelte'
import { expect, test } from 'vitest'
import { render } from 'vitest-browser-svelte'
import MarkerFilter from '$lib/components/marker-filter.svelte'
import MarkerLink from '$lib/components/marker-link.svelte'

const children = createRawSnippet(() => ({ render: () => '<span>Repository</span>' }))

test('renders a reusable marker filter definition', async () => {
  const screen = await render(MarkerFilter)
  const filter = screen.container.querySelector('filter#marker-stroke')

  expect(filter).not.toBeNull()
  expect(filter?.querySelector('feTurbulence')).not.toBeNull()
  expect(filter?.querySelector('feColorMatrix')).not.toBeNull()
  expect(filter?.querySelector('feComposite')).not.toBeNull()
})

test('renders a safe external link with deterministic marker paths', async () => {
  const screen = await render(MarkerLink, {
    href: 'https://example.com/repository',
    label: 'Repository',
    seed: 17,
    children
  })
  const link = screen.getByRole('link', { name: 'Repository' })
  const paths = [...screen.container.querySelectorAll('path')].map((path) => path.getAttribute('d'))

  await expect.element(link).toHaveAttribute('target', '_blank')
  await expect.element(link).toHaveAttribute('rel', 'noopener noreferrer')
  await expect.element(link).toHaveAttribute('href', 'https://example.com/repository')
  expect(paths).toHaveLength(2)

  await screen.rerender({
    href: 'https://example.com/repository',
    label: 'Repository',
    seed: 17,
    children
  })

  expect(
    [...screen.container.querySelectorAll('path')].map((path) => path.getAttribute('d'))
  ).toEqual(paths)
})
