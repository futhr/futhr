/** Head metadata a page returns from its load function; the root layout renders it. */
interface PageMeta {
  readonly title: string
  readonly description: string
  /** Absolute path of the page, used for the canonical URL. */
  readonly path: string
  readonly indexable: boolean
}

export type { PageMeta }
