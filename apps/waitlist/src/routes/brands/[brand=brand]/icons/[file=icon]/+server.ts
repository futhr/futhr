import { error } from '@sveltejs/kit'
import { bindings } from '$lib/server/bindings'
import type { RequestHandler } from './$types'

/** Brand icons sit under /brands/<id>/icons/ in the asset collection; the public path drops the prefix. */
export const GET: RequestHandler = async (event) => {
  const path = `/brands/${event.locals.brand.id}/icons/${event.params.file}`
  const response = await bindings(event).ASSETS.fetch(new URL(path, event.url.origin))
  if (!response.ok) {
    error(404, 'Not found')
  }
  return response
}
