import { content } from '$lib/server/content'
import type { ShowcaseEntry } from '$lib/types/showcase-entry'

const files = import.meta.glob<string>('../content/*.md', {
  eager: true,
  import: 'default',
  query: '?raw'
})

let cache: Promise<ShowcaseEntry[]> | undefined

/** Loads the ordered showcase collection once per build. */
const loadShowcase = (): Promise<ShowcaseEntry[]> => {
  cache ??= content.load(Object.entries(files).map(([filename, source]) => ({ filename, source })))
  return cache
}

export { loadShowcase }
