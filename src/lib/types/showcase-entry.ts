interface ShowcaseLink {
  label: string
  href: string
}

interface ShowcaseEntry {
  order: number
  slug: string
  group: string
  title: string
  lede: string
  repositories: string[]
  links: ShowcaseLink[]
  /** Headline letter pairs the font does not kern, with the extra tracking in em. */
  kerning?: Record<string, number>
  body: string
  bodyHtml: string
}

export type { ShowcaseEntry }
