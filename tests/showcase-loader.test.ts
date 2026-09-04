import { expect, it } from 'vitest'
import { loadShowcase } from '$lib/server/showcase'

it('loads the ordered collection once and reuses it', async () => {
  const first = loadShowcase()
  const second = loadShowcase()
  const items = await first

  expect(second).toBe(first)
  expect(items.map(({ order }) => order)).toEqual(items.map((_, index) => index + 1))
  expect(items[0]?.slug).toBe('thesis')
  expect(items.every((item) => item.body.length > 0 && item.bodyHtml.length > 0)).toBe(true)
})
