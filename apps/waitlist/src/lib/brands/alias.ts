import { brands } from '$lib/brands/brands'
import type { Brand } from '$lib/types/brand'

const portSuffix = /:\d+$/
const trailingDot = /\.$/
const aliases = new Map<string, Brand>([
  ['orvane.ai', brands.orvane],
  ['www.orvane.ai', brands.orvane]
])

/** The canonical brand for a hostname that exists only as a redirecting alias. */
const brandForAliasHost = (host: string | null | undefined): Brand | undefined => {
  if (!host) {
    return undefined
  }
  const hostname = host.trim().toLowerCase().replace(portSuffix, '').replace(trailingDot, '')
  return aliases.get(hostname)
}

export { brandForAliasHost }
