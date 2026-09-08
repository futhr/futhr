import type { RequestHandler } from './$types'

export const GET: RequestHandler = ({ locals }) => {
  const { project } = locals
  const entry = project?.indexed ? `<url><loc>https://${project.host}/</loc></url>` : ''
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entry}</urlset>`,
    { headers: { 'content-type': 'application/xml; charset=utf-8' } }
  )
}
