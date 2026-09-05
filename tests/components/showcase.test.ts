import { expect, test } from 'vitest'
import { render } from 'vitest-browser-svelte'
import Showcase from '$lib/components/showcase.svelte'
import type { ShowcaseEntry } from '$lib/types/showcase-entry'

const items: ShowcaseEntry[] = [
  {
    order: 1,
    slug: 'thesis',
    group: 'Thesis',
    title: 'Thesis',
    lede: 'A group introduction.',
    repositories: [],
    links: [],
    body: 'Markdown source.',
    bodyHtml: '<p>Venture details.</p>'
  },
  {
    order: 2,
    slug: 'refpath',
    group: 'Venture',
    title: 'Refpath',
    lede: 'A project introduction.',
    repositories: ['refpath/refpath'],
    links: [{ label: 'Website', href: 'https://refpath.io' }],
    body: 'Markdown source.',
    bodyHtml: '<p>Refpath details.</p>'
  }
]

test('opens the first item and preserves a single disclosure', async () => {
  const screen = await render(Showcase, { items })
  const venture = screen.getByRole('button', { name: 'Thesis Thesis' })
  const refpath = screen.getByRole('button', { name: 'Venture Refpath' })

  await expect.element(venture).toHaveAttribute('aria-expanded', 'true')
  await expect.element(refpath).toHaveAttribute('aria-expanded', 'false')

  await refpath.click()

  await expect.element(venture).toHaveAttribute('aria-expanded', 'false')
  await expect.element(refpath).toHaveAttribute('aria-expanded', 'true')
  await expect.element(screen.getByText('Refpath details.')).toBeVisible()

  await refpath.click()
  await expect.element(refpath).toHaveAttribute('aria-expanded', 'false')
})

const rows: ShowcaseEntry[] = [
  ...items,
  {
    order: 3,
    slug: 'nuif',
    group: 'Rust & Research',
    title: 'NUIF',
    lede: 'A third row for scroll settling.',
    repositories: ['refpath/nuif'],
    links: [],
    body: 'Markdown source.',
    bodyHtml: '<p>NUIF details.</p>'
  }
]

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

test('animates the closing and opening rows together, then settles', async () => {
  const screen = await render(Showcase, { items: rows })
  const nuif = screen.getByRole('button', { name: 'Rust & Research NUIF' })
  const thesisRow = screen.container.querySelector('#showcase-row-thesis') as HTMLElement
  const nuifRow = screen.container.querySelector('#showcase-row-nuif') as HTMLElement

  await nuif.click()

  expect(thesisRow.getAnimations().length).toBeGreaterThan(0)
  expect(nuifRow.getAnimations().length).toBeGreaterThan(0)
  await wait(600)
  await expect.element(nuif).toHaveAttribute('aria-expanded', 'true')
  expect(thesisRow.getAnimations()).toHaveLength(0)
  expect(nuifRow.getAnimations()).toHaveLength(0)
  expect(nuifRow.style.overflow).toBe('')
})

test('renders an empty collection without a disclosure', async () => {
  const screen = await render(Showcase, { items: [] })

  await expect.element(screen.getByRole('region', { name: 'Selected work' })).toBeVisible()
  expect(screen.container.querySelectorAll('article')).toHaveLength(0)
})
