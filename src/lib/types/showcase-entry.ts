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
  body: string
  bodyHtml: string
}

export type { ShowcaseEntry }
