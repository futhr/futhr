import { agentDocuments } from '$lib/server/agent-documents'
import { loadShowcase } from '$lib/server/showcase'

export const prerender = true

export const GET = async () =>
  new Response(agentDocuments.llmsIndex(await loadShowcase()), {
    headers: { 'content-type': 'text/plain; charset=utf-8' }
  })
