import { agentDocuments } from '$lib/server/agent-documents'

export const prerender = true

export const GET = () =>
  new Response(agentDocuments.stackMatrix(), {
    headers: { 'content-type': 'text/markdown; charset=utf-8' }
  })
