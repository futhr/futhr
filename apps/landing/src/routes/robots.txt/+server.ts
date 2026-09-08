import type { RequestHandler } from './$types'

export const GET: RequestHandler = ({ locals }) => {
  const { project } = locals
  const body = project?.indexed
    ? `User-agent: *\nAllow: /\nSitemap: https://${project.host}/sitemap.xml\n`
    : 'User-agent: *\nDisallow: /\n'
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } })
}
