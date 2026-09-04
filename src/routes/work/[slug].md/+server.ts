import { error } from '@sveltejs/kit'
import { agentDocuments } from '$lib/server/agent-documents'
import { loadShowcase } from '$lib/server/showcase'
import type { EntryGenerator, RequestHandler } from './$types'

export const prerender = true

export const entries: EntryGenerator = async () =>
  (await loadShowcase()).map(({ slug }) => ({ slug }))

export const GET: RequestHandler = async ({ params }) => {
  const item = (await loadShowcase()).find(({ slug }) => slug === params.slug)
  if (!item) {
    error(404, 'Unknown entry')
  }
  return new Response(agentDocuments.entryMarkdown(item), {
    headers: { 'content-type': 'text/markdown; charset=utf-8' }
  })
}
