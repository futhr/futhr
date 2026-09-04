import { site } from '$lib/config/site'

export const prerender = true

export const GET = () =>
  new Response(site.documents.sitemapXml, {
    headers: { 'content-type': 'application/xml; charset=utf-8' }
  })
