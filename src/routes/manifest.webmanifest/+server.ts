import { site } from '$lib/config/site'

export const prerender = true

export const GET = () =>
  new Response(`${JSON.stringify(site.documents.webManifest, null, 2)}\n`, {
    headers: { 'content-type': 'application/manifest+json; charset=utf-8' }
  })
