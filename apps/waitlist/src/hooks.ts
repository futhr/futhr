import type { Reroute } from '@sveltejs/kit/hooks'
import { brandForHost } from '#lib/brands/host.ts'

/** Every public path on a venture hostname is served from that brand's route tree. */
export const reroute: Reroute = ({ url }) => {
  const brand = brandForHost(url.hostname)
  return brand ? `/brands/${brand.id}${url.pathname}` : undefined
}
