import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'
import { parse as parseYaml } from 'yaml'
import type { ShowcaseEntry } from '$lib/types/showcase-entry'

type ShowcaseLink = ShowcaseEntry['links'][number]

interface ShowcaseSource {
  readonly filename: string
  readonly source: string
}

const allowedProtocols = new Set(['http:', 'https:', 'mailto:'])
const markdownExtension = /\.md$/
const kebabCase = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const frontmatter = /^(?:\uFEFF)?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/
// biome-ignore lint/suspicious/noControlCharactersInRegex: reject URL controls before browser normalisation
const unsafeUrlCharacters = /[\\\u0000-\u0020\u007f]/
const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: ['p', 'strong', 'em', 'code', 'ul', 'ol', 'li', 'a'],
  allowedAttributes: {
    a: ['href', 'title']
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowProtocolRelative: false,
  disallowedTagsMode: 'discard'
}

const requiredString = (
  metadata: Record<string, unknown>,
  key: string,
  filename: string
): string => {
  const value = metadata[key]
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${filename}: frontmatter field "${key}" must be a string`)
  }
  return value
}

const safeHref = (value: string, filename: string): string => {
  if (unsafeUrlCharacters.test(value)) {
    throw new Error(`${filename}: link href must not contain whitespace, controls, or backslashes`)
  }
  if (value.startsWith('/') && !value.startsWith('//')) {
    return value
  }

  let url: URL
  try {
    url = new URL(value)
  } catch (error) {
    throw new Error(`${filename}: link href must be an absolute or root-relative URL`, {
      cause: error
    })
  }

  if (!allowedProtocols.has(url.protocol)) {
    throw new Error(`${filename}: link href uses the disallowed protocol "${url.protocol}"`)
  }
  return value
}

const parseLinks = (value: unknown, filename: string): ShowcaseLink[] => {
  if (!Array.isArray(value)) {
    throw new Error(`${filename}: frontmatter field "links" must be an array`)
  }

  const destinations = new Set<string>()
  return value.map((link, index) => {
    if (!link || typeof link !== 'object') {
      throw new Error(`${filename}: links[${index}] must be an object`)
    }
    const entry = link as Record<string, unknown>
    const href = safeHref(
      requiredString(entry, 'href', `${filename} links[${index}]`),
      `${filename} links[${index}]`
    )
    if (destinations.has(href)) {
      throw new Error(`${filename}: duplicate link href "${href}"`)
    }
    destinations.add(href)
    return {
      label: requiredString(entry, 'label', `${filename} links[${index}]`),
      href
    }
  })
}

const parseRepositories = (value: unknown, filename: string): string[] => {
  if (value === undefined) {
    return []
  }
  if (!Array.isArray(value) || value.some((repository) => typeof repository !== 'string')) {
    throw new Error(`${filename}: frontmatter field "repositories" must be an array of strings`)
  }
  return value
}

const parseKerning = (
  value: unknown,
  title: string,
  filename: string
): Record<string, number> | undefined => {
  if (value === undefined) {
    return undefined
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${filename}: frontmatter field "kerning" must map letter pairs to numbers`)
  }
  const kerning: Record<string, number> = {}
  for (const [pair, amount] of Object.entries(value)) {
    if ([...pair].length !== 2 || !title.includes(pair)) {
      throw new Error(`${filename}: kerning pair "${pair}" must be two characters from the title`)
    }
    if (typeof amount !== 'number' || !Number.isFinite(amount) || Math.abs(amount) > 0.5) {
      throw new Error(`${filename}: kerning for "${pair}" must be a number between -0.5 and 0.5`)
    }
    kerning[pair] = amount
  }
  return kerning
}

const slugFromFilename = (filename: string): string => {
  const slug = filename.split('/').at(-1)?.replace(markdownExtension, '') ?? ''
  if (!kebabCase.test(slug)) {
    throw new Error(`${filename}: filename must be a kebab-case Markdown filename`)
  }
  return slug
}

const parseShowcaseSource = async ({
  filename,
  source
}: ShowcaseSource): Promise<ShowcaseEntry> => {
  const match = source.match(frontmatter)
  if (!match) {
    throw new Error(`${filename}: Markdown must start with closed YAML frontmatter`)
  }
  let data: unknown
  try {
    data = parseYaml(match[1] ?? '', { maxAliasCount: 0 })
  } catch (error) {
    throw new Error(`${filename}: invalid YAML frontmatter`, { cause: error })
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error(`${filename}: YAML frontmatter must be a mapping`)
  }
  const metadata = data as Record<string, unknown>
  const { kerning, links, order, repositories } = metadata
  if (typeof order !== 'number' || !Number.isInteger(order) || order < 1) {
    throw new Error(`${filename}: frontmatter field "order" must be a positive integer`)
  }

  const title = requiredString(metadata, 'title', filename)
  const parsedKerning = parseKerning(kerning, title, filename)
  const body = source.slice(match[0].length).trim()
  const rendered = await marked.parse(body, { async: true })
  return {
    order,
    slug: slugFromFilename(filename),
    group: requiredString(metadata, 'group', filename),
    title,
    ...(parsedKerning ? { kerning: parsedKerning } : {}),
    lede: requiredString(metadata, 'lede', filename),
    repositories: parseRepositories(repositories, filename),
    links: parseLinks(links, filename),
    body,
    bodyHtml: sanitizeHtml(rendered, sanitizeOptions)
  }
}

const loadShowcaseContent = async (
  sources: readonly ShowcaseSource[]
): Promise<ShowcaseEntry[]> => {
  const items = await Promise.all(sources.map(parseShowcaseSource))
  const orders = new Set<number>()
  for (const item of items) {
    if (orders.has(item.order)) {
      throw new Error(`Duplicate showcase order: ${item.order}`)
    }
    orders.add(item.order)
  }
  const ordered = items.sort((left, right) => left.order - right.order)
  for (const [index, item] of ordered.entries()) {
    const expected = index + 1
    if (item.order !== expected) {
      throw new Error(
        `Showcase order must be contiguous: expected ${expected}, found ${item.order}`
      )
    }
  }
  return ordered
}

const content = {
  load: loadShowcaseContent,
  parse: parseShowcaseSource
} as const

export { content }
