import { brandDocuments } from '$lib/brands/documents'
import type { RequestHandler } from './$types'

type Documents = ReturnType<typeof brandDocuments>

/** Body and content type per generated document; src/params/document.ts admits only these names. */
const documents = {
  'manifest.webmanifest': (d: Documents) => [
    `${JSON.stringify(d.webManifest, null, 2)}\n`,
    'application/manifest+json; charset=utf-8'
  ],
  'robots.txt': (d: Documents) => [d.robotsText, 'text/plain; charset=utf-8'],
  'sitemap.xml': (d: Documents) => [d.sitemapXml, 'application/xml; charset=utf-8'],
  'llms.txt': (d: Documents) => [d.llmsText, 'text/plain; charset=utf-8']
} as const satisfies Record<string, (d: Documents) => readonly [string, string]>

export const GET: RequestHandler = ({ locals, params }) => {
  const [body, type] = documents[params.document as keyof typeof documents](
    brandDocuments(locals.brand)
  )
  return new Response(body, { headers: { 'content-type': type } })
}
