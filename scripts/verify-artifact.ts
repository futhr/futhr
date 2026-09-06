import { access, readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'
import process from 'node:process'

const storyFilePattern = /(?:^|\/)iframe\.html$|\.stories\./
const siteOnlyFiles = new Set([
  'llms.txt',
  'manifest.webmanifest',
  'service-worker.js',
  'sw.js',
  'sitemap.xml'
])

const requireFile = async (path: string) => {
  try {
    await access(path)
  } catch (error) {
    throw new Error(`Required artifact file is missing: ${path}`, { cause: error })
  }
}

const collectFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name)
      return entry.isDirectory() ? collectFiles(path) : Promise.resolve([path])
    })
  )
  return files.flat()
}

/** The prerendered site: a home page and no story files. */
const verifyWeb = async () => {
  const directory = 'build'
  await requireFile(join(directory, 'index.html'))
  const stories = (await collectFiles(directory)).filter((file) => storyFilePattern.test(file))
  if (stories.length > 0) {
    throw new Error(`Story files leaked into the web artifact: ${stories.join(', ')}`)
  }
}

/** Storybook: complete, excluded from search, and free of site-only files. */
const verifyStorybook = async () => {
  const directory = 'storybook-static'
  await Promise.all(
    ['_headers', 'index.html', 'iframe.html', 'index.json', 'robots.txt'].map((file) =>
      requireFile(join(directory, file))
    )
  )
  const [headers, robots] = await Promise.all([
    readFile(join(directory, '_headers'), 'utf8'),
    readFile(join(directory, 'robots.txt'), 'utf8')
  ])
  if (!(headers.includes('X-Robots-Tag: noindex, nofollow') && robots.includes('Disallow: /'))) {
    throw new Error('Storybook must remain excluded from search indexing')
  }
  const leaked = (await collectFiles(directory))
    .map((file) => relative(directory, file))
    .filter((file) => siteOnlyFiles.has(file) || file.startsWith('icons/'))
  if (leaked.length > 0) {
    throw new Error(`Site-only files leaked into the Storybook artifact: ${leaked.join(', ')}`)
  }
}

const [, , target] = process.argv
if (target === 'web') {
  await verifyWeb()
} else if (target === 'storybook') {
  await verifyStorybook()
} else {
  throw new Error('Expected an artifact target: web or storybook')
}
