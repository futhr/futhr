import { createHash } from 'node:crypto'
import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'

interface Manifest {
  files: Record<string, { bytes: number; sha256: string }>
}

const appDirectory = resolve(import.meta.dirname, '..')
const siteDirectory = resolve(appDirectory, 'dist')
const manifest = JSON.parse(
  await readFile(resolve(siteDirectory, 'browser-core/manifest.json'), 'utf8')
) as Manifest
const required = [
  'index.html',
  'manifest.webmanifest',
  'runtime.html',
  'runtime-entry.mjs',
  'service-worker.js',
  'browser-core/SHA256SUMS',
  'browser-core/sbom.spdx.json'
]

await Promise.all(required.map((path) => access(resolve(siteDirectory, path))))

for (const [path, expected] of Object.entries(manifest.files)) {
  const bytes = await readFile(resolve(siteDirectory, 'browser-core', path))
  const digest = createHash('sha256').update(bytes).digest('hex')
  if (!(bytes.byteLength === expected.bytes && digest === expected.sha256)) {
    throw new Error(`Built browser-core bytes changed during packaging: ${path}`)
  }
}

for (const browser of ['chromium', 'firefox']) {
  const directory = resolve(appDirectory, 'dist-extensions', browser)
  const extensionManifest = JSON.parse(
    await readFile(resolve(directory, 'manifest.json'), 'utf8')
  ) as {
    manifest_version?: number
  }
  if (extensionManifest.manifest_version !== 3) {
    throw new Error(`${browser} is not a Manifest V3 package.`)
  }

  for (const [path, expected] of Object.entries(manifest.files)) {
    const bytes = await readFile(resolve(directory, 'browser-core', path))
    const digest = createHash('sha256').update(bytes).digest('hex')
    if (digest !== expected.sha256) {
      throw new Error(`${browser} browser-core differs from the site artifact: ${path}`)
    }
  }
}

process.stdout.write('ExkPasswd site and extension artifacts verified.\n')
