import type { RequestEvent } from '@sveltejs/kit'
import type { PublicEnv } from '$lib/server/public-env'

/** The Worker bindings, which the Cloudflare adapter supplies on every request. */
const bindings = (event: RequestEvent): PublicEnv => {
  const env = event.platform?.env
  if (!env) {
    throw new Error('Cloudflare bindings are missing; this app only runs on Workers')
  }
  return env
}

export { bindings }
