import { site } from '$lib/config/site'
import { entryText } from '$lib/entry-text'
import type { ShowcaseEntry } from '$lib/types/showcase-entry'
import guide from '../../../AGENTS.md?raw'
import manifest from '../../../package.json'

const absolute = (path: string) => new URL(path, site.canonicalUrl).href

const stackRows: ReadonlyArray<readonly [layer: string, name: string]> = [
  ['Framework', '@sveltejs/kit'],
  ['Component model', 'svelte'],
  ['Adapter', '@sveltejs/adapter-static'],
  ['Build', 'vite'],
  ['Styling', 'tailwindcss'],
  ['Language', 'typescript'],
  ['Lint and format', '@biomejs/biome'],
  ['Unit and component tests', 'vitest'],
  ['Browser tests', '@playwright/test'],
  ['Component workshop', 'storybook'],
  ['Markdown', 'marked'],
  ['Sanitising', 'sanitize-html'],
  ['Frontmatter', 'gray-matter'],
  ['Deployment', 'wrangler']
]

const dependencyVersion = (name: string): string =>
  manifest.devDependencies[name as keyof typeof manifest.devDependencies] ?? 'not pinned'

/** The llms.txt index in the llmstxt.org shape: name, summary, curated file lists. */
const llmsIndex = (items: readonly ShowcaseEntry[]): string => {
  const work = items.map(
    (item) =>
      `- [${entryText.plainTitle(item)}](${absolute(`/work/${item.slug}.md`)}): ${item.lede}`
  )
  const agents = site.footer.agents
    .filter((item) => item.href !== '/llms.txt')
    .map((item) => `- [${item.label}](${absolute(item.href)})`)
  return `# ${site.displayName}

> ${site.machineSummary.introduction} ${site.machineSummary.summary}

${site.machineSummary.guidance}

## Work

${work.join('\n')}

## For agents

${agents.join('\n')}

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

/** Pinned runtimes and tooling, read from package.json at build time. */
const stackMatrix = (): string => {
  const rows = stackRows.map(
    ([layer, name]) => `| ${layer} | \`${name}\` | ${dependencyVersion(name)} |`
  )
  return `# Stack matrix

Generated from package.json at build time for ${site.displayName}. Versions are exact pins; the site is a prerendered static artifact with no server runtime.

| Layer | Package | Version |
| --- | --- | --- |
| Runtime | Node.js | ${manifest.engines.node} |
| Package manager | pnpm | ${manifest.packageManager.replace('pnpm@', '')} |
${rows.join('\n')}

## Browser support

Evergreen browsers. Layout depends on CSS container queries and container units, \`inert\`, and the Web Animations API.

## Commands

\`\`\`bash
pnpm install
pnpm dev            # SvelteKit dev server on :5173
pnpm storybook      # Storybook on :6006
pnpm quality        # Biome lint, format check, export constraints
pnpm check          # svelte-check and TypeScript
pnpm test:all       # unit, component, Storybook, end-to-end
pnpm build          # prerender to build/ and verify the artifact
\`\`\`

The agent guide at ${absolute('/agents.md')} explains conventions and the definition of done.
`
}

const agentDocuments = {
  entryMarkdown: entryText.markdown,
  guide,
  llmsFull,
  llmsIndex,
  stackMatrix
} as const

export { agentDocuments }
