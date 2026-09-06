import { readdir, readFile } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'
import ts from 'typescript'

const sourceDirectories = ['src', 'apps/waitlist/src']
const svelteExportPattern =
  /\bexport\s+(?:default|const|let|var|function|class|interface|type|\{|\*)/gv
const multipleExportExceptions = new Set([
  'src/routes/agents.md/+server.ts',
  'src/routes/agents/stack.md/+server.ts',
  'src/routes/llms-full.txt/+server.ts',
  'src/routes/llms.txt/+server.ts',
  'src/routes/work/[slug].md/+server.ts',
  'src/routes/manifest.webmanifest/+server.ts',
  'src/routes/robots.txt/+server.ts',
  'src/routes/sitemap.xml/+server.ts',
  'apps/waitlist/src/hooks.server.ts',
  'apps/waitlist/src/routes/brands/[brand=brand]/+page.server.ts',
  'apps/waitlist/src/routes/brands/[brand=brand]/withdraw/+page.server.ts'
])

const collectSourceFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true })
  const paths = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name)
      return entry.isDirectory() ? collectSourceFiles(path) : Promise.resolve([path])
    })
  )
  return paths.flat().filter((path) => ['.ts', '.svelte'].includes(extname(path)))
}

const countTypeScriptExports = (source: string, filename: string) => {
  const file = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, false)
  return file.statements.reduce((count, statement) => {
    if (ts.isExportDeclaration(statement)) {
      return (
        count +
        (statement.exportClause && ts.isNamedExports(statement.exportClause)
          ? statement.exportClause.elements.length
          : 1)
      )
    }
    const modifiers = ts.canHaveModifiers(statement) ? ts.getModifiers(statement) : undefined
    return count + (modifiers?.some(({ kind }) => kind === ts.SyntaxKind.ExportKeyword) ? 1 : 0)
  }, 0)
}

const files = (await Promise.all(sourceDirectories.map(collectSourceFiles))).flat()
const sources = await Promise.all(
  files.map(async (filename) => ({ filename, source: await readFile(filename, 'utf8') }))
)
const violations: string[] = []
for (const { filename, source } of sources) {
  const exports =
    extname(filename) === '.ts'
      ? countTypeScriptExports(source, filename)
      : [...source.matchAll(svelteExportPattern)].length
  const projectPath = relative('.', filename)
  if (exports > 1 && !multipleExportExceptions.has(projectPath)) {
    violations.push(`${projectPath} (${exports} exports)`)
  }
}

if (violations.length > 0) {
  throw new Error(`Source files must expose at most one symbol:\n${violations.join('\n')}`)
}
