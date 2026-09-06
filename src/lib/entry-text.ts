import type { ShowcaseEntry } from '$lib/types/showcase-entry'

/** Titles may carry a soft hyphen for the headline; plain text gets the whole word. */
const plainTitle = (item: ShowcaseEntry): string => item.title.replaceAll('\u00AD', '')

/** One entry as a Markdown document: title, ingress, facts, body. */
const markdown = (item: ShowcaseEntry): string => {
  const facts = [`- Group: ${item.group}`]
  if (item.repositories.length > 0) {
    facts.push(`- Repositories: ${item.repositories.join(', ')}`)
  }
  for (const link of item.links) {
    facts.push(`- ${link.label}: ${link.href}`)
  }
  return `# ${plainTitle(item)}\n\n> ${item.lede}\n\n${facts.join('\n')}\n\n${item.body}\n`
}

/** Text renderings of an entry shared by the generated documents and the WebMCP tools. */
const entryText = { plainTitle, markdown } as const

export { entryText }
