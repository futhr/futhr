import { brandForHost } from '$lib/brands/host'
import type { Brand } from '$lib/types/brand'

const prefix = /^www\./

/**
 * The brand whose apex a `www` hostname belongs to. The Worker answers such
 * requests with a permanent redirect to the apex on the same scheme, path,
 * and query, so the `www` hostnames can be attached as Custom Domains too.
 */
const apexForWww = (host: string | null | undefined): Brand | undefined => {
  const hostname = host?.trim().toLowerCase() ?? ''
  return prefix.test(hostname) ? brandForHost(hostname.replace(prefix, '')) : undefined
}

export { apexForWww }
