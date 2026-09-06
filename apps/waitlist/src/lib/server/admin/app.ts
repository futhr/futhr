import { verifyAccessJwt } from '$lib/server/admin/access'
import type { AdminActor } from '$lib/server/admin/actor'
import type { AdminEnv } from '$lib/server/admin/env'
import { grants } from '$lib/server/admin/grants'
import { adminResponses } from '$lib/server/admin/responses'
import { adminStore } from '$lib/server/admin/store'
import { vault } from '$lib/server/crypto'
import { secrets } from '$lib/server/secrets'
import type { SubscriptionRow } from '$lib/server/subscription-row'
import type { Brand } from '$lib/types/brand'

type Reply = Response | Promise<Response>

interface AdminCall {
  readonly request: Request
  readonly env: AdminEnv
  readonly actor: AdminActor
  readonly url: URL
  readonly segments: readonly string[]
}

const { status, json, problem } = adminResponses
const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const defaultPageSize = 50

const notFound = () => problem(status.notFound, 'not_found')
const methodNotAllowed = () => problem(status.methodNotAllowed, 'method_not_allowed')

const authenticate = async (request: Request, env: AdminEnv): Promise<AdminActor | null> => {
  const verified = await verifyAccessJwt(request.headers.get('cf-access-jwt-assertion'), {
    teamDomain: env.ACCESS_TEAM_DOMAIN,
    audience: env.ACCESS_AUDIENCE
  })
  return verified
    ? {
        identity: verified.identity,
        grants: grants.parse(env.ADMIN_BRAND_GRANTS, verified.identity)
      }
    : null
}

const audited = (call: AdminCall, action: string, brand: Brand, subjectId: string | null) =>
  adminStore.audit(call.env.DB, {
    actor: call.actor.identity,
    action,
    brandId: brand.id,
    subjectId,
    at: new Date().toISOString()
  })

/** One row as the API returns it, decrypted with the key version the row names. */
const serialise = async (env: AdminEnv, brand: Brand, row: SubscriptionRow) => ({
  id: row.id,
  brand: brand.id,
  email: await vault.decrypt(
    { ciphertext: row.email_ciphertext, iv: row.email_iv },
    secrets(env).keyFor(row.encryption_key_version)
  ),
  consent_version: row.consent_version,
  joined_at: row.joined_at
})

const listBrands = (call: AdminCall): Response =>
  call.request.method === 'GET'
    ? json(
        status.ok,
        grants.allowedBrands(call.actor).map(({ id, host, name }) => ({ id, host, name }))
      )
    : methodNotAllowed()

/** The list with addresses; every page read is audited. */
const listSubscriptions = async (call: AdminCall, brand: Brand): Promise<Response> => {
  const requested = Number(call.url.searchParams.get('limit') ?? defaultPageSize)
  const page = await adminStore.list(call.env.DB, brand.id, {
    cursor: call.url.searchParams.get('cursor'),
    limit: Number.isInteger(requested) ? requested : defaultPageSize
  })
  const items = await Promise.all(page.items.map((row) => serialise(call.env, brand, row)))
  await audited(call, 'subscriptions.list', brand, null)
  return json(status.ok, { items, next_cursor: page.nextCursor })
}

const deleteSubscription = async (call: AdminCall, brand: Brand, id: string): Promise<Response> => {
  if (!(idPattern.test(id) && (await adminStore.remove(call.env.DB, brand.id, id)))) {
    return notFound()
  }
  await audited(call, 'subscription.delete', brand, id)
  return json(status.noContent, null)
}

const brandRoutes = (call: AdminCall): Reply => {
  const [, , brandId, collection, id] = call.segments
  const brand = grants.brandFor(call.actor, brandId)
  if (!brand) {
    return problem(status.forbidden, 'brand_not_permitted')
  }
  if (collection !== 'subscriptions') {
    return notFound()
  }
  if (call.segments.length === 4) {
    return call.request.method === 'GET' ? listSubscriptions(call, brand) : methodNotAllowed()
  }
  if (id && call.segments.length === 5) {
    return call.request.method === 'DELETE'
      ? deleteSubscription(call, brand, id)
      : methodNotAllowed()
  }
  return notFound()
}

const dispatch = (call: AdminCall): Reply => {
  const [version, resource] = call.segments
  if (version !== 'v1' || resource !== 'brands') {
    return notFound()
  }
  return call.segments.length === 2 ? listBrands(call) : brandRoutes(call)
}

const fetchHandler = async (request: Request, env: AdminEnv): Promise<Response> => {
  try {
    const actor = await authenticate(request, env)
    if (!actor) {
      return problem(status.unauthorized, 'unauthorized')
    }
    const url = new URL(request.url)
    return await dispatch({
      request,
      env,
      actor,
      url,
      segments: url.pathname.split('/').filter(Boolean)
    })
  } catch (error) {
    console.error('admin request failed', error instanceof Error ? error.message : 'unknown error')
    return problem(status.serverError, 'internal_error')
  }
}

const adminApp = { fetch: fetchHandler } as const

export { adminApp }
