import { site } from '$lib/config/site'
import { entryText } from '$lib/entry-text'
import type { ShowcaseEntry } from '$lib/types/showcase-entry'

const absolute = (path: string) => new URL(path, site.canonicalUrl).href
const ids = {
  person: absolute('/#person'),
  site: absolute('/#website'),
  page: absolute('/#page'),
  work: absolute('/#work')
}
const languageByGroup: Readonly<Record<string, string>> = {
  'Elixir & OTP': 'Elixir',
  'Ruby & Solidus': 'Ruby'
}
const github = /^https:\/\/github\.com\//

/** One entry as a schema.org node. Entries with source become SoftwareSourceCode. */
const workNode = (item: ShowcaseEntry) => {
  const repositories = item.links.filter(({ href }) => github.test(href)).map(({ href }) => href)
  const other = item.links
    .filter(({ href }) => !github.test(href))
    .map(({ href }) => absolute(href))
  const language = languageByGroup[item.group]
  return {
    '@type': item.repositories.length > 0 ? 'SoftwareSourceCode' : 'CreativeWork',
    '@id': absolute(`/#${item.slug}`),
    name: entryText.plainTitle(item),
    description: item.lede,
    url: absolute(`/#showcase-row-${item.slug}`),
    keywords: item.group,
    author: { '@id': ids.person },
    isPartOf: { '@id': ids.site },
    subjectOf: {
      '@type': 'DigitalDocument',
      url: absolute(`/work/${item.slug}.md`),
      encodingFormat: 'text/markdown'
    },
    ...(repositories.length > 0 ? { codeRepository: repositories } : {}),
    ...(language ? { programmingLanguage: language } : {}),
    ...(other.length > 0 ? { sameAs: other } : {})
  }
}

/**
 * JSON-LD for the page: the person, the site, the profile page, and the work as an
 * ordered list. Every value mirrors visible page content or the generated documents.
 */
const structuredData = (items: readonly ShowcaseEntry[]): string =>
  JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': ids.person,
        name: site.author.name,
        url: site.canonicalUrl,
        image: site.images.social,
        jobTitle: site.author.role,
        description: site.author.description,
        homeLocation: { '@type': 'Place', name: site.author.location },
        knowsAbout: site.author.topics,
        sameAs: [site.links.github, site.links.mastodon, site.links.bluesky, site.links.x]
      },
      {
        '@type': 'WebSite',
        '@id': ids.site,
        name: site.name,
        alternateName: site.displayName,
        url: site.canonicalUrl,
        description: site.description,
        inLanguage: site.language,
        creator: { '@id': ids.person },
        publisher: { '@id': ids.person }
      },
      {
        '@type': 'ProfilePage',
        '@id': ids.page,
        url: site.canonicalUrl,
        name: site.seo.title,
        description: site.seo.description,
        inLanguage: site.language,
        isPartOf: { '@id': ids.site },
        mainEntity: { '@id': ids.person },
        hasPart: { '@id': ids.work }
      },
      {
        '@type': 'ItemList',
        '@id': ids.work,
        name: site.ui.selectedWork,
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        numberOfItems: items.length,
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: workNode(item)
        }))
      }
    ]
  }).replaceAll('<', '\\u003c')

export { structuredData }
