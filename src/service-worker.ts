/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />

import { build, files, prerendered, version } from '$service-worker'

const successfulStatus = 200
const serviceWorker = globalThis as unknown as ServiceWorkerGlobalScope
const cacheName = `futhr-${version}`
const assets = [...build, ...files, ...prerendered]
// Hashed build output never changes under the same URL, so it is safe to serve
// from the cache first. Everything else (HTML, generated documents, icons) is
// fetched from the network first so a new deploy or a dev-server change shows
// up on the next load, with the cache only as the offline fallback.
const immutable = new Set(build)

const install = async (): Promise<void> => {
  const cache = await caches.open(cacheName)
  await cache.addAll(assets)
  await serviceWorker.skipWaiting()
}

const activate = async (): Promise<void> => {
  const keys = await caches.keys()
  await Promise.all(keys.filter((key) => key !== cacheName).map((key) => caches.delete(key)))
  await serviceWorker.clients.claim()
}

const store = async (request: Request, response: Response): Promise<Response> => {
  if (response.status === successfulStatus && response.type !== 'opaque') {
    const cache = await caches.open(cacheName)
    await cache.put(request, response.clone())
  }
  return response
}

const cacheFirst = async (request: Request): Promise<Response> =>
  (await caches.match(request)) ?? store(request, await fetch(request))

const networkFirst = async (request: Request): Promise<Response> => {
  try {
    return await store(request, await fetch(request))
  } catch (error) {
    const cached = await caches.match(request)
    if (cached) {
      return cached
    }
    throw error
  }
}

serviceWorker.addEventListener('install', (event) => {
  event.waitUntil(install())
})

serviceWorker.addEventListener('activate', (event) => {
  event.waitUntil(activate())
})

serviceWorker.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET' || url.origin !== serviceWorker.location.origin) {
    return
  }

  event.respondWith(
    immutable.has(url.pathname) ? cacheFirst(event.request) : networkFirst(event.request)
  )
})
