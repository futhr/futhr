import { agentDocuments } from '#lib/server/agent-documents.ts'
import { loadShowcase } from '#lib/server/showcase.ts'

export const prerender = true

export const GET = async () =>
  new Response(agentDocuments.sitemap(await loadShowcase()), {
    headers: { 'content-type': 'application/xml; charset=utf-8' }
  })
