import { site } from '$lib/config/site'
import { entryText } from '$lib/entry-text'
import type { ShowcaseEntry } from '$lib/types/showcase-entry'

const absolute = (path: string) => new URL(path, site.canonicalUrl).href

/** The llms.txt index in the llmstxt.org shape: name, summary, curated file lists. */
const llmsIndex = (items: readonly ShowcaseEntry[]): string => {
  const work = items.map(
    (item) =>
      `- [${entryText.plainTitle(item)}](${absolute(`/work/${item.slug}.md`)}): ${item.lede}`
  )
  const siteLinks = [...site.footer.agents, ...site.footer.elsewhere]
    .filter((item) => item.href !== null && item.href !== '/llms.txt')
    .map((item) => `- [${item.label}](${absolute(item.href as string)})`)
  return `# ${site.displayName}

> ${site.machineSummary.introduction} ${site.machineSummary.summary}

${site.machineSummary.guidance}

## Work

${work.join('\n')}

## Site

${siteLinks.join('\n')}

## Optional

- [GitHub](${site.links.github}): public source for the open libraries
- [Contact](${site.links.email})
`
}

/** Every entry as Markdown in one file, for agents that want the whole portfolio at once. */
const llmsFull = (items: readonly ShowcaseEntry[]): string =>
  `# ${site.displayName}\n\n> ${site.machineSummary.introduction} ${site.machineSummary.summary}\n\n${items
    .map((item) => `Source: ${absolute(`/work/${item.slug}.md`)}\n\n${entryText.markdown(item)}`)
    .join('\n---\n\n')}`

/** Sitemap with the page and every text document, so crawlers and agents find the same index. */
const sitemap = (items: readonly ShowcaseEntry[]): string => {
  const url = (path: string, priority: string) =>
    `  <url>\n    <loc>${absolute(path)}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>\n  </url>`
  const urls = [
    url('/', '1.0'),
    url('/llms.txt', '0.8'),
    url('/llms-full.txt', '0.8'),
    ...items.map((item) => url(`/work/${item.slug}.md`, '0.6'))
  ]
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
}

const agentDocuments = {
  entryMarkdown: entryText.markdown,
  llmsFull,
  llmsIndex,
  sitemap
} as const

export { agentDocuments }
