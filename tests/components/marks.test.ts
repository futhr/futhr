import { expect, test } from 'vitest'
import { render } from 'vitest-browser-svelte'
import Conjunct from '$lib/components/marks/conjunct.svelte'
import Diggymon from '$lib/components/marks/diggymon.svelte'
import Frameshift from '$lib/components/marks/frameshift.svelte'
import Futhr from '$lib/components/marks/futhr.svelte'
import Ghostshift from '$lib/components/marks/ghostshift.svelte'
import Orvane from '$lib/components/marks/orvane.svelte'
import Recetas from '$lib/components/marks/recetas.svelte'
import Refpath from '$lib/components/marks/refpath.svelte'
import Reloved from '$lib/components/marks/reloved.svelte'
import Rivure from '$lib/components/marks/rivure.svelte'
import Wotex from '$lib/components/marks/wotex.svelte'
import Marks from '$lib/components/marks.svelte'

const markComponents = [
  ['Futhr', Futhr],
  ['Ghostshift Assembly', Ghostshift],
  ['Refpath', Refpath],
  ['Diggymon', Diggymon],
  ['Orvane', Orvane],
  ['Reloved', Reloved],
  ['Rivure', Rivure],
  ['Recetas', Recetas],
  ['WoTEx', Wotex],
  ['Frameshift', Frameshift],
  ['Conjunct', Conjunct]
] as const

test('renders each reusable logo component as an accessible image', async () => {
  await Promise.all(
    markComponents.map(async ([name, Mark]) => {
      const screen = await render(Mark)
      await expect.element(screen.getByRole('img', { name: `${name} mark` })).toBeVisible()
    })
  )
})

const footerOrder = ['Ghostshift Assembly', 'Refpath', 'Rivure', 'WoTEx', 'Frameshift']

test('renders the footer marks in order', async () => {
  const screen = await render(Marks)
  await Promise.all(
    footerOrder.map((name) =>
      expect.element(screen.getByRole('img', { name: `${name} mark` })).toBeVisible()
    )
  )
  expect(
    [...screen.container.querySelectorAll('.mark > [role="img"]')].map((mark) =>
      mark.getAttribute('aria-label')
    )
  ).toEqual(footerOrder.map((name) => `${name} mark`))
})
