import { site } from '$lib/config/site'

export const prerender = true

export const GET = () =>
  new Response(site.documents.robotsText, {
    headers: { 'content-type': 'text/plain; charset=utf-8' }
  })
