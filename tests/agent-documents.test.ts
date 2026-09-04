import { describe, expect, it } from 'vitest'
import { site } from '$lib/config/site'
import { agentDocuments } from '$lib/server/agent-documents'
import type { ShowcaseEntry } from '$lib/types/showcase-entry'

const frameworkRow = /\| Framework \| `@sveltejs\/kit` \| \d+\.\d+\.\d+ \|/

const items: ShowcaseEntry[] = [
  {
    order: 1,
    slug: 'thesis',
    group: 'Thesis',
    title: 'Trust, interoper\u00ADability, unit economics.',
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
    links: [
      { label: 'Repository', href: 'https://github.com/refpath/sigil_guard' },
      { label: 'HexDocs', href: 'https://hexdocs.pm/sigil_guard/' }
    ],
    body: 'An embedded Elixir enforcement layer.',
    bodyHtml: '<p>An embedded Elixir enforcement layer.</p>'
  }
]

describe('agent documents', () => {
  it('renders an entry as Markdown with its facts and body', () => {
    const markdown = agentDocuments.entryMarkdown(items[1] as ShowcaseEntry)

    expect(markdown).toBe(`# SigilGuard

> The in-process security runtime for autonomous agents.

- Group: Elixir & OTP
- Repositories: refpath/sigil_guard
- Repository: https://github.com/refpath/sigil_guard
- HexDocs: https://hexdocs.pm/sigil_guard/

An embedded Elixir enforcement layer.
`)
    const thesis = agentDocuments.entryMarkdown(items[0] as ShowcaseEntry)
    expect(thesis).not.toContain('Repositories:')
    expect(thesis).toContain('# Trust, interoperability, unit economics.')
    expect(thesis).not.toContain('\u00AD')
  })

  it('builds an llms.txt index that links every entry and agent resource', () => {
    const index = agentDocuments.llmsIndex(items)

    expect(index.startsWith(`# ${site.displayName}\n\n> `)).toBe(true)
    expect(index).toContain(site.machineSummary.guidance)
    expect(index).toContain('- [SigilGuard](https://futhr.io/work/sigil-guard.md): The in-process')
    expect(index).toContain('- [Agent guide](https://futhr.io/agents.md)')
    expect(index).toContain('- [Stack matrix](https://futhr.io/agents/stack.md)')
    expect(index).toContain('- [Full portfolio](https://futhr.io/llms-full.txt)')
    expect(index).not.toContain('[llms.txt](')
    expect(index).toContain(`- [GitHub](${site.links.github})`)
    expect(index).toContain(`- [Contact](${site.links.email})`)
  })

  it('concatenates every entry with its source URL into llms-full.txt', () => {
    const full = agentDocuments.llmsFull(items)

    expect(full).toContain('Source: https://futhr.io/work/thesis.md')
    expect(full).toContain('Source: https://futhr.io/work/sigil-guard.md')
    expect(full.split('\n---\n')).toHaveLength(2)
    expect(full).toContain('# SigilGuard')
  })

  it('exposes the agent guide and a stack matrix read from package.json', () => {
    expect(agentDocuments.guide).toContain('# AGENTS.md')
    expect(agentDocuments.guide).toContain('## Definition of done')

    const stack = agentDocuments.stackMatrix()
    expect(stack).toContain('| Runtime | Node.js | >=24 |')
    expect(stack).toContain('| Package manager | pnpm | 11.24.0 |')
    expect(stack).toMatch(frameworkRow)
    expect(stack).toContain('https://futhr.io/agents.md')
  })
})
