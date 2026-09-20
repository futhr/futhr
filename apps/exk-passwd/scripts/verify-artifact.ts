import { createHash } from 'node:crypto'
import { access, readdir, readFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
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

const serviceWorker = await readFile(resolve(siteDirectory, 'service-worker.js'), 'utf8')
if (!serviceWorker.includes("const shellPath = '/exk-passwd/'")) {
  throw new Error('Service worker must precache the canonical deployed app URL.')
}
if (serviceWorker.includes('"/exk-passwd/index.html"')) {
  throw new Error('Service worker must not precache the Pages redirect for index.html.')
}

for (const [path, expected] of Object.entries(manifest.files)) {
  const bytes = await readFile(resolve(siteDirectory, 'browser-core', path))
  const digest = createHash('sha256').update(bytes).digest('hex')
  if (!(bytes.byteLength === expected.bytes && digest === expected.sha256)) {
    throw new Error(`Built browser-core bytes changed during packaging: ${path}`)
  }
}

const extensionDirectory = resolve(appDirectory, 'dist-extensions/chromium')
const extensionFiles = await readdir(extensionDirectory, { recursive: true })
const chromeManifestPaths = extensionFiles
  .filter((path) => basename(path) === 'manifest.json')
  .sort()
if (!(chromeManifestPaths.length === 1 && chromeManifestPaths[0] === 'manifest.json')) {
  throw new Error(
    `Chromium package must contain exactly one manifest.json at its root; found: ${chromeManifestPaths.join(', ')}`
  )
}

const extensionManifest = JSON.parse(
  await readFile(resolve(extensionDirectory, 'manifest.json'), 'utf8')
) as {
  manifest_version?: number
}
if (extensionManifest.manifest_version !== 3) {
  throw new Error('Chromium is not a Manifest V3 package.')
}

const extensionCoreManifest = await readFile(
  resolve(extensionDirectory, 'browser-core/core-metadata.json')
)
const siteCoreManifest = await readFile(resolve(siteDirectory, 'browser-core/manifest.json'))
if (!extensionCoreManifest.equals(siteCoreManifest)) {
  throw new Error('Chromium browser-core metadata differs from the site artifact.')
}

for (const [path, expected] of Object.entries(manifest.files)) {
  const bytes = await readFile(resolve(extensionDirectory, 'browser-core', path))
  const digest = createHash('sha256').update(bytes).digest('hex')
  if (digest !== expected.sha256) {
    throw new Error(`Chromium browser-core differs from the site artifact: ${path}`)
  }
}

process.stdout.write('ExkPasswd site and extension artifacts verified.\n')
