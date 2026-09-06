import { expect, test } from 'vitest'
import { render } from 'vitest-browser-svelte'
import Ager from '$lib/components/logos/ager.svelte'
import Futhr from '$lib/components/logos/futhr.svelte'
import Wotex from '$lib/components/logos/wotex.svelte'
import Marks from '$lib/components/marks.svelte'

const markShapes = [
  ['Diggymon', 'rect', 1],
  ['Orvane', 'path', 1],
  ['Refpath', 'linearGradient', 2],
  ['Reloved', 'ellipse', 2],
  ['Rivure', 'path', 2]
] as const

test('renders the Futhr identity as an accessible image', async () => {
  const screen = await render(Futhr)

  await expect.element(screen.getByRole('img', { name: 'Futhr mark' })).toBeVisible()
})

test('renders the Äger mark as an accessible image', async () => {
  const screen = await render(Ager)

  await expect.element(screen.getByRole('img', { name: 'Äger mark' })).toBeVisible()
  expect(screen.container.querySelectorAll('circle')).toHaveLength(2)
  expect(screen.container.querySelectorAll('path')).toHaveLength(2)
})

test('renders the WoTEx library mark as an accessible image', async () => {
  const screen = await render(Wotex)

  await expect.element(screen.getByRole('img', { name: 'WoTEx mark' })).toBeVisible()
})

test('renders every venture mark in footer order', async () => {
  const screen = await render(Marks)

  await Promise.all(
    ['Refpath', 'Bytly', 'Diggymon', 'Orvane', 'Reloved', 'Rivure', 'Äger'].map((name) =>
      expect.element(screen.getByRole('img', { name: `${name} mark` })).toBeVisible()
    )
  )
  expect(screen.container.querySelectorAll('svg')).toHaveLength(7)

  for (const [name, selector, count] of markShapes) {
    const mark = screen.container.querySelector(`svg[aria-label="${name} mark"]`)
    expect(mark?.querySelectorAll(selector)).toHaveLength(count)
  }
})
