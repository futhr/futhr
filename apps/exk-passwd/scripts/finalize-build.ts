import { createHash } from 'node:crypto'
import { cp, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'

const appDirectory = resolve(import.meta.dirname, '..')
const outputDirectory = resolve(appDirectory, 'dist')
const coreDirectory = resolve(appDirectory, 'browser-core')

await cp(coreDirectory, resolve(outputDirectory, 'browser-core'), { recursive: true })

const collect = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory)
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry)
      return (await stat(path)).isDirectory() ? await collect(path) : [path]
    })
  )
  return nested.flat()
}

const assetFiles = (await collect(outputDirectory))
  .filter((path) => !path.endsWith('/service-worker.js'))
  .sort()
const assets = assetFiles.map((path) => {
  const deployedPath = `/exk-passwd/${relative(outputDirectory, path)}`
  if (deployedPath === '/exk-passwd/index.html') {
    return '/exk-passwd/'
  }
  return deployedPath === '/exk-passwd/runtime.html' ? '/exk-passwd/runtime' : deployedPath
})
const cacheRevision = createHash('sha256')
for (const path of assetFiles) {
  cacheRevision.update(relative(outputDirectory, path))
  cacheRevision.update(await readFile(path))
}
const manifest = JSON.parse(await readFile(resolve(coreDirectory, 'manifest.json'), 'utf8')) as {
  browser_core_version: string
}
const cacheName = `exk-passwd-${manifest.browser_core_version}-${cacheRevision.digest('hex').slice(0, 12)}`

const serviceWorker = `const cacheName = ${JSON.stringify(cacheName)}
const cachePrefix = 'exk-passwd-'
const assets = ${JSON.stringify(assets, null, 2)}
const shellPath = '/exk-passwd/'
const precached = new Set(assets)

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(assets)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith(cachePrefix) && key !== cacheName).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return
  let path = url.pathname === '/exk-passwd/index.html' ? shellPath : url.pathname
  if (path === '/exk-passwd/runtime.html') path = '/exk-passwd/runtime'
  if (precached.has(path)) {
    event.respondWith(caches.match(path).then((cached) => cached || fetch(event.request)))
    return
  }
  event.respondWith(
    fetch(event.request).catch(async () => (await caches.match(event.request)) || (await caches.match(shellPath)))
  )
})
`

await writeFile(resolve(outputDirectory, 'service-worker.js'), serviceWorker)
