import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { afterEach, expect, it } from 'vitest'

const exec = promisify(execFile)
const script = fileURLToPath(new URL('../scripts/verify-artifact.ts', import.meta.url))
const temporary: string[] = []

const artifact = async (files: Record<string, string>) => {
  const cwd = await mkdtemp(join(tmpdir(), 'futhr-artifact-'))
  temporary.push(cwd)
  await Promise.all(
    Object.entries(files).map(async ([path, contents]) => {
      const file = join(cwd, path)
      await mkdir(join(file, '..'), { recursive: true })
      await writeFile(file, contents)
    })
  )
  return cwd
}

afterEach(async () => {
  await Promise.all(temporary.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})

it('rejects Storybook runtime code hidden in a hashed web chunk', async () => {
  const cwd = await artifact({
    'build/index.html': '<!doctype html>',
    'build/_app/immutable/chunks/abc.js': 'globalThis.__STORYBOOK__ = true'
  })
  await expect(exec(process.execPath, [script, 'web'], { cwd })).rejects.toThrow(
    'Storybook code leaked'
  )
})

it('allows documentation to describe Storybook without treating it as bundled code', async () => {
  const cwd = await artifact({
    'build/index.html': '<!doctype html>',
    'build/agents.md': 'Use @storybook/addon-vitest for the review surface.'
  })
  await expect(exec(process.execPath, [script, 'web'], { cwd })).resolves.toMatchObject({
    stderr: ''
  })
})

it('rejects generated portfolio documents in the Storybook artifact', async () => {
  const cwd = await artifact({
    'storybook-static/index.html': '<!doctype html>',
    'storybook-static/iframe.html': '<!doctype html>',
    'storybook-static/index.json': '{}',
    'storybook-static/robots.txt': 'User-agent: *\nDisallow: /',
    'storybook-static/_headers': '/*\n  X-Robots-Tag: noindex, nofollow',
    'storybook-static/llms-full.txt': 'Portfolio'
  })
  await expect(exec(process.execPath, [script, 'storybook'], { cwd })).rejects.toThrow(
    'Site-only files leaked'
  )
})
