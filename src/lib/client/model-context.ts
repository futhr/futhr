import { entryText } from '$lib/entry-text'
import type { ShowcaseEntry } from '$lib/types/showcase-entry'

interface ShowcaseToolHost {
  items: readonly ShowcaseEntry[]
  open: (slug: string) => void | Promise<void>
}

const noop = () => undefined

const text = (value: string): ModelContextToolResult => ({
  content: [{ type: 'text', text: value }]
})
const failure = (value: string): ModelContextToolResult => ({ ...text(value), isError: true })

const summary = (item: ShowcaseEntry) => ({
  slug: item.slug,
  group: item.group,
  title: entryText.plainTitle(item),
  lede: item.lede,
  links: item.links
})

const slugSchema = (items: readonly ShowcaseEntry[]) => ({
  type: 'object',
  properties: {
    slug: {
      type: 'string',
      description: 'Entry slug as returned by list-work',
      enum: items.map(({ slug }) => slug)
    }
  },
  required: ['slug']
})

/**
 * Registers the showcase as WebMCP tools when the browser exposes
 * `document.modelContext`. Everywhere else this is a no-op. Returns a function
 * that unregisters the tools.
 */
const registerShowcaseTools = ({ items, open }: ShowcaseToolHost): (() => void) => {
  const context = globalThis.document?.modelContext
  if (typeof context?.registerTool !== 'function' || items.length === 0) {
    return noop
  }

  const controller = new AbortController()
  const options = { signal: controller.signal }
  const find = (input: { slug?: unknown }) => items.find(({ slug }) => slug === input.slug)

  const tools: ModelContextTool[] = [
    {
      name: 'list-work',
      description:
        'List every entry on this portfolio page: ventures, open-source libraries, research, and talks, with slug, group, one-sentence summary, and links.',
      inputSchema: { type: 'object', properties: {} },
      execute: () => text(JSON.stringify(items.map(summary)))
    },
    {
      name: 'open-entry',
      description:
        'Expand one entry on the page so the reader sees its full description, and scroll it into view.',
      inputSchema: slugSchema(items),
      execute: async (input) => {
        const item = find(input)
        if (!item) {
          return failure(`Unknown slug. Valid slugs: ${items.map(({ slug }) => slug).join(', ')}`)
        }
        await open(item.slug)
        return text(`Opened ${entryText.plainTitle(item)}.`)
      }
    },
    {
      name: 'get-entry',
      description:
        'Return the full description of one entry as Markdown, without changing the page.',
      inputSchema: slugSchema(items),
      execute: (input) => {
        const item = find(input)
        return item
          ? text(entryText.markdown(item))
          : failure('Unknown slug. Call list-work first.')
      }
    }
  ]

  for (const tool of tools) {
    context.registerTool(tool, options).catch(() => {
      // Registration can be refused by permissions policy; the page works without it.
    })
  }

  return () => controller.abort()
}

export { registerShowcaseTools }
