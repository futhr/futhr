import type { RequestHandler } from './$types'

export const GET: RequestHandler = ({ locals }) =>
  Response.json(
    {
      name: locals.project?.name,
      short_name: locals.project?.name,
      id: '/',
      start_url: '/',
      scope: '/',
      display: 'minimal-ui',
      background_color: '#1b1b1b',
      theme_color: '#1b1b1b',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
      ]
    },
    { headers: { 'content-type': 'application/manifest+json; charset=utf-8' } }
  )
