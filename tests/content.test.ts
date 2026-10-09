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
  ['a non-URL link', 'https://example.com/repository', 'not-a-URL', 'absolute or root-relative'],
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

    expect(items).toHaveLength(14)
    expect(items[0]).toMatchObject({ order: 1, slug: 'thesis', group: 'Thesis' })
    expect(items[1]).toMatchObject({ order: 2, slug: 'wotex', group: 'Elixir & OTP' })
    expect(items[2]).toMatchObject({ order: 3, slug: 'ex-maude', group: 'Elixir & OTP' })
    expect(items[3]).toMatchObject({ order: 4, slug: 'exk-passwd', group: 'Elixir & OTP' })
    expect(items.at(-1)).toMatchObject({
      order: 14,
      slug: 'frameshift',
      group: 'Research',
      repositories: ['ghostshift-assembly/frameshift']
    })
    expect(items.map(({ order }) => order)).toEqual(Array.from({ length: 14 }, (_, i) => i + 1))
    expect([...new Set(items.map(({ group }) => group))]).toEqual([
      'Thesis',
      'Elixir & OTP',
      'Ruby & Solidus',
      'Research'
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

describe('optional showcase fields', () => {
  it('parses headline kerning pairs that appear in the title', async () => {
    const item = await content.parse({
      filename: 'kerned.md',
      source: source('kerning:\n  xa: -0.06\n')
    })

    expect(item.kerning).toEqual({ xa: -0.06 })
  })

  it('leaves kerning undefined when the field is omitted', async () => {
    const item = await content.parse({ filename: 'plain.md', source: source() })

    expect(item.kerning).toBeUndefined()
  })
})

describe('YAML frontmatter validation', () => {
  it.each([
    [
      'missing frontmatter',
      'A body without metadata.',
      'Markdown must start with closed YAML frontmatter'
    ],
    ['an unclosed block', '---\norder: 1\n', 'Markdown must start with closed YAML frontmatter'],
    [
      'a different language',
      '---javascript\n({order: 1})\n---\n',
      'Markdown must start with closed YAML frontmatter'
    ],
    ['a scalar root', '---\nvalue\n---\n', 'YAML frontmatter must be a mapping'],
    ['a sequence root', '---\n- value\n---\n', 'YAML frontmatter must be a mapping'],
    ['a null root', '---\nnull\n---\n', 'YAML frontmatter must be a mapping'],
    ['malformed YAML', '---\norder: [\n---\n', 'invalid YAML frontmatter'],
    ['duplicate keys', source('order: 2\n'), 'invalid YAML frontmatter'],
    ['aliases', source('alias: &alias value\ncopy: *alias\n'), 'invalid YAML frontmatter']
  ])('rejects %s with the filename in its error', async (_case, invalid, message) => {
    await expect(content.parse({ filename: 'invalid.md', source: invalid })).rejects.toThrow(
      `invalid.md: ${message}`
    )
  })

  it('accepts a UTF-8 BOM and Windows line endings without swallowing body separators', async () => {
    const item = await content.parse({
      filename: 'windows.md',
      source: `\uFEFF${source('', 'First paragraph.\n\n---\n\nSecond paragraph.').replaceAll('\n', '\r\n')}`
    })

    expect(item.title).toBe('Example')
    expect(item.body).toContain('---')
    expect(item.bodyHtml).toContain('Second paragraph.')
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

  it.each([
    ['a pair missing from the title', 'kerning:\n  oT: -0.06\n', 'two characters from the title'],
    ['a non-numeric amount', 'kerning:\n  xa: tight\n', 'between -0.5 and 0.5'],
    ['an out-of-range amount', 'kerning:\n  xa: -1\n', 'between -0.5 and 0.5'],
    ['a non-object field', 'kerning: tight\n', 'map letter pairs to numbers']
  ])('rejects %s in the kerning field', async (_case, overrides, message) => {
    await expect(
      content.parse({ filename: 'bad-kerning.md', source: source(overrides) })
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

it('rejects browser-normalised external links disguised as root-relative paths', async () => {
  await expect(
    content.parse({
      filename: 'unsafe-link.md',
      source: source().replace('https://example.com/repository', String.raw`/\evil.example`)
    })
  ).rejects.toThrow('backslashes')
})

it('rejects duplicate link keys before rendering the component', async () => {
  const duplicate = source().replace(
    'links:',
    'links:\n  - label: Another label\n    href: https://example.com/repository'
  )
  await expect(content.parse({ filename: 'duplicate-link.md', source: duplicate })).rejects.toThrow(
    'duplicate link href'
  )
})
