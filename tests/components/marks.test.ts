import { expect, test } from 'vitest'
import { render } from 'vitest-browser-svelte'
import Agr from '$lib/components/marks/agr.svelte'
import Bytly from '$lib/components/marks/bytly.svelte'
import Diggymon from '$lib/components/marks/diggymon.svelte'
import Futhr from '$lib/components/marks/futhr.svelte'
import Orvane from '$lib/components/marks/orvane.svelte'
import Recetas from '$lib/components/marks/recetas.svelte'
import Refpath from '$lib/components/marks/refpath.svelte'
import Reloved from '$lib/components/marks/reloved.svelte'
import Rivure from '$lib/components/marks/rivure.svelte'
import Wotex from '$lib/components/marks/wotex.svelte'
import Marks from '$lib/components/marks.svelte'

const markComponents = [
  ['Futhr', Futhr],
  ['Refpath', Refpath],
  ['Bytly', Bytly],
  ['Diggymon', Diggymon],
  ['Orvane', Orvane],
  ['Reloved', Reloved],
  ['Rivure', Rivure],
  ['ÄGR', Agr],
  ['Recetas', Recetas],
  ['WoTEx', Wotex]
] as const

test('renders each reusable logo component as an accessible image', async () => {
  await Promise.all(
    markComponents.map(async ([name, Mark]) => {
      const screen = await render(Mark)
      await expect.element(screen.getByRole('img', { name: `${name} mark` })).toBeVisible()
    })
  )
})

test('renders every venture mark in footer order', async () => {
  const screen = await render(Marks)
  await Promise.all(
    markComponents
      .slice(1)
      .map(([name]) =>
        expect.element(screen.getByRole('img', { name: `${name} mark` })).toBeVisible()
      )
  )
  expect(screen.container.querySelectorAll('.mark')).toHaveLength(9)
  expect(screen.container.querySelectorAll('.mark svg')).toHaveLength(9)
})
