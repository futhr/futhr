import { brands } from '$lib/brands/brands'
import type { AdminActor } from '$lib/server/admin/actor'
import type { Brand } from '$lib/types/brand'
import type { BrandId } from '$lib/types/brand-id'

/** Parses the ADMIN_BRAND_GRANTS JSON for one identity; anything malformed grants nothing. */
const parse = (raw: string, identity: string): ReadonlySet<string> => {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const list = parsed[identity]
    return new Set(Array.isArray(list) ? list.filter((item) => typeof item === 'string') : [])
  } catch {
    return new Set()
  }
}

const allowedBrands = (actor: AdminActor): Brand[] =>
  Object.values(brands).filter(
    (brand) =>
      actor.grants.has('*') ||
      actor.grants.has(brand.id) ||
      actor.reviewGrants.has('*') ||
      actor.reviewGrants.has(brand.id)
  )

/** The brand for a path segment, if it exists and the actor may touch it. */
const brandFor = (actor: AdminActor, id: string | undefined, review = false): Brand | null => {
  const brand = id && Object.hasOwn(brands, id) ? brands[id as BrandId] : null
  return brand &&
    (actor.grants.has('*') ||
      actor.grants.has(brand.id) ||
      (review && (actor.reviewGrants.has('*') || actor.reviewGrants.has(brand.id))))
    ? brand
    : null
}

const grants = { parse, allowedBrands, brandFor } as const

export { grants }
