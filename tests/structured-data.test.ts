import { describe, expect, it } from 'vitest'
import { site } from '$lib/config/site'
import { structuredData } from '$lib/server/structured-data'
import type { ShowcaseEntry } from '$lib/types/showcase-entry'

const items: ShowcaseEntry[] = [
  {
    order: 1,
    slug: 'thesis',
    group: 'Thesis',
    title: 'Trust, interoper\u00ADability, unit economics.',
    lede: 'Platforms for domains where software decisions carry real consequences.',
    repositories: [],
    links: [],
    body: 'A portfolio.',
    bodyHtml: '<p>A portfolio.</p>'
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
    body: 'An enforcement layer.',
    bodyHtml: '<p>An enforcement layer.</p>'
  }
]

interface Node {
  '@type': string
  '@id'?: string
  name?: string
  url?: string
  sameAs?: string[]
  knowsAbout?: string[]
  numberOfItems?: number
  codeRepository?: string[]
  itemListElement?: Array<{ position: number; item: Node }>
  creator?: { '@id': string }
  mainEntity?: { '@id': string }
}

describe('structured data', () => {
  const graph = (JSON.parse(structuredData(items)) as { '@graph': Node[] })['@graph']
  const byType = (type: string) => graph.find((node) => node['@type'] === type)

  it('describes the person, the site, and the profile page with cross references', () => {
    const person = byType('Person')
    const website = byType('WebSite')
    const page = byType('ProfilePage')

    expect(person).toMatchObject({ name: site.author.name, url: site.canonicalUrl })
    expect(person?.sameAs).toEqual([
      site.links.github,
      site.links.mastodon,
      site.links.bluesky,
      site.links.x
    ])
    expect(person?.knowsAbout).toEqual(site.author.topics)
    expect(website).toMatchObject({ name: site.name, creator: { '@id': person?.['@id'] } })
    expect(page).toMatchObject({ mainEntity: { '@id': person?.['@id'] } })
  })

  it('lists every entry in order, with source code nodes for entries that have repositories', () => {
    const list = byType('ItemList')
    const elements = list?.itemListElement ?? []

    expect(list?.numberOfItems).toBe(2)
    expect(elements.map(({ position }) => position)).toEqual([1, 2])
    expect(elements[0]?.item).toMatchObject({
      '@type': 'CreativeWork',
      name: 'Trust, interoperability, unit economics.',
      url: 'https://futhr.io/#showcase-row-thesis'
    })
    expect(elements[0]?.item.codeRepository).toBeUndefined()
    expect(elements[1]?.item).toMatchObject({
      '@type': 'SoftwareSourceCode',
      codeRepository: ['https://github.com/refpath/sigil_guard'],
      programmingLanguage: 'Elixir',
      sameAs: ['https://hexdocs.pm/sigil_guard/'],
      subjectOf: { url: 'https://futhr.io/work/sigil-guard.md' }
    })
  })

  it('cannot close the script element it is embedded in', () => {
    expect(structuredData(items)).not.toContain('<')
  })
})
