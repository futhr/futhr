import { describe, expect, it } from 'vitest'
import { content } from '$lib/server/content'

const contentFiles = import.meta.glob<string>('../src/lib/content/*.md', {
  eager: true,
  import: 'default',
  query: '?raw'
})

const source = (overrides = '', body = 'Safe **Markdown**.') => `---
order: 1
group: Test
title: Example
lede: A useful example.
repositories: []
links:
  - label: Repository
    href: https://example.com/repository
${overrides}---

${body}`

const invalidFields = [
  ['a non-URL link', 'https://example.com/repository', 'not a URL', 'absolute or root-relative'],
  [
    'a protocol-relative link',
    'https://example.com/repository',
    '//example.com',
    'absolute or root-relative'
  ],
  [
    'a non-array links field',
    'links:\n  - label: Repository\n    href: https://example.com/repository',
    'links: invalid',
    'must be an array'
  ],
  [
    'a non-object link',
    'links:\n  - label: Repository\n    href: https://example.com/repository',
    'links:\n  - invalid',
    'must be an object'
  ],
  ['a non-array repository field', 'repositories: []', 'repositories: invalid', 'array of strings'],
  ['an empty group', 'group: Test', "group: ''", 'must be a string'],
  ['an empty required title', 'title: Example', "title: ''", 'must be a string']
]

const invalidOrders = [
  ['zero', '0'],
  ['a fraction', '1.5'],
  ['a string', "'first'"]
]

describe('valid showcase content', () => {
  it('parses and orders the complete content collection', async () => {
    const sources = Object.entries(contentFiles).map(([filename, markdown]) => ({
      filename,
      source: markdown
    }))
    const items = await content.load(sources)

    expect(items).toHaveLength(15)
    expect(items[0]).toMatchObject({ order: 1, slug: 'thesis', group: 'Thesis' })
    expect(items[13]).toMatchObject({ order: 14, slug: 'ager', group: 'Venture', title: 'Äger' })
    expect(items.at(-1)).toMatchObject({ order: 15, slug: 'goatmire-2026', group: 'Conf talks' })
    expect(items.map(({ order }) => order)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1))
    expect([...new Set(items.map(({ group }) => group))]).toEqual([
      'Thesis',
      'Elixir & OTP',
      'Ruby & Solidus',
      'Rust & Research',
      'Venture',
      'Conf talks'
    ])
  })

  it('renders safe Markdown and removes executable HTML', async () => {
    const item = await content.parse({
      filename: 'safe-example.md',
      source: source('', 'Hello **world**.<script>alert(1)</script>')
    })

    expect(item.bodyHtml).toContain('<strong>world</strong>')
    expect(item.bodyHtml).not.toContain('<script')
    expect(item.bodyHtml).not.toContain('alert(1)')
  })

  it.each(['/internal', 'mailto:hello@example.com'])(
    'accepts the safe link destination %s',
    async (href) => {
      const item = await content.parse({
        filename: 'safe-link.md',
        source: source().replace('https://example.com/repository', href)
      })

      expect(item.links[0]?.href).toBe(href)
    }
  )

  it('defaults an omitted repositories field to an empty collection', async () => {
    const item = await content.parse({
      filename: 'without-repositories.md',
      source: source().replace('repositories: []\n', '')
    })

    expect(item.repositories).toEqual([])
  })
})

describe('showcase field validation', () => {
  it('rejects unsafe frontmatter links', async () => {
    const invalid = source().replace('https://example.com/repository', 'javascript:alert(1)')

    await expect(content.parse({ filename: 'unsafe-link.md', source: invalid })).rejects.toThrow(
      'disallowed protocol'
    )
  })

  it.each(invalidFields)('rejects %s', async (_case, target, replacement, message) => {
    await expect(
      content.parse({
        filename: 'invalid-frontmatter.md',
        source: source().replace(target, replacement)
      })
    ).rejects.toThrow(message)
  })

  it.each(invalidOrders)('rejects %s as an order value', async (_case, order) => {
    await expect(
      content.parse({
        filename: 'invalid-order.md',
        source: source().replace('order: 1', `order: ${order}`)
      })
    ).rejects.toThrow('must be a positive integer')
  })
})

describe('showcase collection ordering', () => {
  it('rejects duplicate order values', async () => {
    const sources = [
      { filename: 'first.md', source: source() },
      { filename: 'second.md', source: source() }
    ]

    await expect(content.load(sources)).rejects.toThrow('Duplicate showcase order: 1')
  })

  it('rejects gaps in frontmatter order values', async () => {
    const sources = [
      { filename: 'first.md', source: source() },
      { filename: 'second.md', source: source().replace('order: 1', 'order: 3') }
    ]

    await expect(content.load(sources)).rejects.toThrow(
      'Showcase order must be contiguous: expected 2, found 3'
    )
  })

  it('requires kebab-case Markdown filenames', async () => {
    await expect(content.parse({ filename: 'Not Valid.md', source: source() })).rejects.toThrow(
      'kebab-case Markdown filename'
    )
  })
})
