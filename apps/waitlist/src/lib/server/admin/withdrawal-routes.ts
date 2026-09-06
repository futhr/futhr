import type { AdminActor } from '$lib/server/admin/actor'
import type { AdminEnv } from '$lib/server/admin/env'
import { adminResponses } from '$lib/server/admin/responses'
import { adminStore } from '$lib/server/admin/store'
import { withdrawals } from '$lib/server/admin/withdrawals'
import { vault } from '$lib/server/crypto'
import { joinData } from '$lib/server/join-data'
import { secrets } from '$lib/server/secrets'

interface Call {
  request: Request
  env: AdminEnv
  actor: AdminActor
  brandId: string
  segments: readonly string[]
}

const { json, problem } = adminResponses
const casePattern = /^case-[a-z0-9-]{1,64}$/
const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

const audited = (call: Call, action: string, subjectId: string | null) =>
  adminStore.audit(call.env.DB, {
    actor: call.actor.identity,
    action,
    brandId: call.brandId,
    subjectId,
    at: new Date().toISOString()
  })

const listing = async (call: Call) => {
  const page = await withdrawals.list(
    call.env.DB,
    call.brandId,
    new URL(call.request.url).searchParams.get('cursor')
  )
  if (!page) {
    return problem(400, 'invalid_cursor')
  }
  await audited(call, 'withdrawals.list', null)
  return json(200, page)
}

const detail = async (call: Call, id: string) => {
  const row = await withdrawals.get(call.env.DB, call.brandId, id)
  if (!row) {
    return problem(404, 'not_found')
  }
  const email =
    row.email_ciphertext && row.email_iv && row.encryption_key_version
      ? await vault.decrypt(
          { ciphertext: row.email_ciphertext, iv: row.email_iv },
          secrets(call.env).keyFor(row.encryption_key_version)
        )
      : null
  await audited(call, 'withdrawal.read', id)
  return json(200, { id: row.id, status: row.status, requested_at: row.requested_at, email })
}

const resolveRequest = async (call: Call, id: string) => {
  let data: FormData
  try {
    data = await joinData(call.request)
  } catch {
    return problem(400, 'invalid_form')
  }
  const decision = data.get('decision')
  const caseReference = data.get('case_reference')
  if (
    !(
      (decision === 'mailbox_reply' ||
        decision === 'already_absent' ||
        decision === 'not_requester' ||
        decision === 'duplicate') &&
      typeof caseReference === 'string' &&
      casePattern.test(caseReference)
    )
  ) {
    return problem(400, 'invalid_decision')
  }
  const completed = await withdrawals.resolve(call.env.DB, {
    brandId: call.brandId,
    id,
    actor: call.actor.identity,
    decision,
    caseReference
  })
  return completed ? json(204, null) : problem(409, 'not_resolvable')
}

const withdrawalRoutes = (call: Call) => {
  const { request, actor, brandId, segments } = call
  const [, , , , id, action] = segments
  if (segments.length === 4) {
    return request.method === 'GET' ? listing(call) : problem(405, 'method_not_allowed')
  }
  if (!(actor.grants.has('*') || actor.grants.has(brandId))) {
    return problem(403, 'operator_required')
  }
  if (!(id && idPattern.test(id))) {
    return problem(404, 'not_found')
  }
  if (segments.length === 5) {
    return request.method === 'GET' ? detail(call, id) : problem(405, 'method_not_allowed')
  }
  if (segments.length === 6 && action === 'resolve') {
    return request.method === 'POST' ? resolveRequest(call, id) : problem(405, 'method_not_allowed')
  }
  return problem(404, 'not_found')
}

export { withdrawalRoutes }
