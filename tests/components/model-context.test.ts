import { afterEach, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import Showcase from '$lib/components/showcase.svelte'
import type { ShowcaseEntry } from '$lib/types/showcase-entry'

const items: ShowcaseEntry[] = [
  {
    order: 1,
    slug: 'thesis',
    group: 'Thesis',
    title: 'Trust, interoper­ability, unit economics.',
    lede: 'Platforms for domains where software decisions carry real consequences.',
    repositories: [],
    links: [],
    body: 'A capital-efficient portfolio.',
    bodyHtml: '<p>A capital-efficient portfolio.</p>'
  },
  {
    order: 2,
    slug: 'sigil-guard',
    group: 'Elixir & OTP',
    title: 'SigilGuard',
    lede: 'The in-process security runtime for autonomous agents.',
    repositories: ['refpath/sigil_guard'],
    links: [{ label: 'Repository', href: 'https://github.com/refpath/sigil_guard' }],
    body: 'An embedded Elixir enforcement layer.',
    bodyHtml: '<p>An embedded Elixir enforcement layer.</p>'
  }
]

const registerTool = vi.fn<
  (tool: ModelContextTool, options?: ModelContextRegisterOptions) => Promise<void>
>(() => Promise.resolve())

afterEach(() => {
  registerTool.mockClear()
  Reflect.deleteProperty(document, 'modelContext')
})

test('registers list, open, and get tools when the browser offers a model context', async () => {
  Object.defineProperty(document, 'modelContext', { value: { registerTool }, configurable: true })
  const screen = await render(Showcase, { items })

  expect(registerTool).toHaveBeenCalledTimes(3)
  const tools = registerTool.mock.calls.map(([tool]) => tool)
  expect(tools.map(({ name }) => name)).toEqual(['list-work', 'open-entry', 'get-entry'])
  expect(registerTool.mock.calls[0]?.[1]).toHaveProperty('signal')

  const listed = JSON.parse((await tools[0]?.execute({}))?.content[0]?.text ?? '[]') as Array<{
    slug: string
    title: string
  }>
  expect(listed.map(({ slug }) => slug)).toEqual(['thesis', 'sigil-guard'])
  expect(listed[0]?.title).toBe('Trust, interoperability, unit economics.')

  const opened = await tools[1]?.execute({ slug: 'sigil-guard' })
  expect(opened?.content[0]?.text).toBe('Opened SigilGuard.')
  await expect
    .element(screen.getByRole('button', { name: 'Elixir & OTP SigilGuard' }))
    .toHaveAttribute('aria-expanded', 'true')

  const missing = await tools[1]?.execute({ slug: 'nope' })
  expect(missing?.isError).toBe(true)

  const entry = await tools[2]?.execute({ slug: 'sigil-guard' })
  expect(entry?.content[0]?.text).toContain('# SigilGuard')
  expect(entry?.content[0]?.text).toContain('- Repository: https://github.com/refpath/sigil_guard')
  expect(entry?.content[0]?.text).toContain('An embedded Elixir enforcement layer.')
  expect((await tools[2]?.execute({ slug: 'nope' }))?.isError).toBe(true)
})

test('does nothing when the browser has no model context', async () => {
  await render(Showcase, { items })

  expect(registerTool).not.toHaveBeenCalled()
})
