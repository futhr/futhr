import { brands } from '$lib/brands/brands'
import type { Brand } from '$lib/types/brand'
import type { BrandId } from '$lib/types/brand-id'

const portSuffix = /:\d+$/
const trailingDot = /\.$/
const localStandIn = /^([a-z]+)\.localhost$/

const byHost: ReadonlyMap<string, Brand> = new Map(
  Object.values(brands).map((brand) => [brand.host, brand])
)

/**
 * Resolves the brand for an exact hostname. Case and a trailing dot are
 * normalised; a port is dropped because local development uses one. On a
 * workstation `<id>.localhost` stands in for the apex, since browsers resolve
 * every `.localhost` name to this machine; a deployed Worker never sees one.
 * Anything else, including www and subdomains, is unknown and the caller fails
 * closed.
 */
const brandForHost = (host: string | null | undefined): Brand | undefined => {
  if (!host) {
    return undefined
  }
  const hostname = host.trim().toLowerCase().replace(portSuffix, '').replace(trailingDot, '')
  const id = localStandIn.exec(hostname)?.[1]
  return (
    byHost.get(hostname) ?? (id && Object.hasOwn(brands, id) ? brands[id as BrandId] : undefined)
  )
}

export { brandForHost }
