import { access, readdir, readFile } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'
import process from 'node:process'

const textExtensions = new Set(['.css', '.html', '.js', '.json', '.map', '.txt', '.xml'])
const storyFilePattern = /(?:^|\/)iframe\.html$|\.stories\./
const storyCodePattern = /@storybook|__STORYBOOK__|storybook-static/

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

const verifyWeb = async () => {
  const directory = 'build'
  await requireFile(join(directory, 'index.html'))

  const files = await collectFiles(directory)
  const storyFiles = files.filter((file) => storyFilePattern.test(file))
  if (storyFiles.length > 0) {
    throw new Error(`Story files leaked into the web artifact: ${storyFiles.join(', ')}`)
  }

  const textFiles = files.filter((file) => textExtensions.has(extname(file)))
  const scanned = await Promise.all(
    textFiles.map(async (file) => ({ file, contents: await readFile(file, 'utf8') }))
  )
  const leaked = scanned
    .filter(({ contents }) => storyCodePattern.test(contents))
    .map(({ file }) => relative(directory, file))
  if (leaked.length > 0) {
    throw new Error(`Storybook code leaked into the web artifact: ${leaked.join(', ')}`)
  }
}

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

  const files = await collectFiles(directory)
  const webOnlyFiles = new Set([
    'llms.txt',
    'manifest.webmanifest',
    'service-worker.js',
    'sitemap.xml'
  ])
  const leaked = files
    .map((file) => relative(directory, file))
    .filter((file) => webOnlyFiles.has(file) || file.startsWith('icons/'))
  if (leaked.length > 0) {
    throw new Error(`Web-only files leaked into the Storybook artifact: ${leaked.join(', ')}`)
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
