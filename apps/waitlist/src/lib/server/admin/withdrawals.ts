import { withdrawalPolicy } from '$lib/server/withdrawal-policy'

interface RequestRow {
  id: string
  brand_id: string
  subscription_id: string
  requested_at: string
  status: 'pending' | 'completed' | 'dismissed'
  joined_at: string | null
  email_ciphertext: string | null
  email_iv: string | null
  encryption_key_version: string | null
}

const list = async (db: D1Database, brandId: string, after: string | null) => {
  const cursor = after
    ? await db
        .prepare('SELECT requested_at FROM withdrawal_requests WHERE brand_id = ?1 AND id = ?2')
        .bind(brandId, after)
        .first<string>('requested_at')
    : null
  if (after && !cursor) {
    return null
  }
  const rows = await db
    .prepare(`SELECT r.id, r.brand_id, r.requested_at, r.status,
      s.joined_at, s.id IS NOT NULL AS subscription_present
    FROM withdrawal_requests r LEFT JOIN subscriptions s ON s.id = r.subscription_id AND s.brand_id = r.brand_id
    WHERE r.brand_id = ?1 AND r.status = 'pending' AND (r.requested_at, r.id) > (?2, ?3)
    ORDER BY r.requested_at, r.id LIMIT ?4`)
    .bind(brandId, cursor ?? '', after ?? '', withdrawalPolicy.maxPageSize + 1)
    .all<{
      id: string
      brand_id: string
      requested_at: string
      status: string
      joined_at: string | null
      subscription_present: number
    }>()
  const items = rows.results.slice(0, withdrawalPolicy.maxPageSize)
  return {
    items,
    next_cursor:
      rows.results.length > withdrawalPolicy.maxPageSize ? (items.at(-1)?.id ?? null) : null
  }
}

const get = (db: D1Database, brandId: string, id: string) =>
  db
    .prepare(`SELECT r.id, r.brand_id, r.subscription_id, r.requested_at, r.status,
    s.joined_at, s.email_ciphertext, s.email_iv, s.encryption_key_version
  FROM withdrawal_requests r LEFT JOIN subscriptions s ON s.id = r.subscription_id AND s.brand_id = r.brand_id
  WHERE r.brand_id = ?1 AND r.id = ?2`)
    .bind(brandId, id)
    .first<RequestRow>()

/** Approval is the operator's attestation of a mailbox reply, not an AI classification. */
const resolve = async (
  db: D1Database,
  input: {
    brandId: string
    id: string
    actor: string
    decision: 'mailbox_reply' | 'already_absent' | 'not_requester' | 'duplicate'
    caseReference: string
  }
) => {
  const { brandId, id, actor, decision, caseReference } = input
  const at = new Date().toISOString()
  const approved = decision === 'mailbox_reply' || decision === 'already_absent'
  const statements = [
    db
      .prepare(`INSERT INTO audit_log (id, at, actor, action, brand_id, subject_id)
      SELECT ?1, ?2, ?3, ?4, brand_id, id FROM withdrawal_requests
      WHERE brand_id = ?5 AND id = ?6 AND status = 'pending'
      AND (?7 <> 'already_absent' OR NOT EXISTS (SELECT 1 FROM subscriptions WHERE id = withdrawal_requests.subscription_id AND brand_id = withdrawal_requests.brand_id))`)
      .bind(
        crypto.randomUUID(),
        at,
        actor,
        approved ? 'withdrawal.complete' : 'withdrawal.dismiss',
        brandId,
        id,
        decision
      )
  ]
  if (decision === 'mailbox_reply') {
    statements.push(
      db
        .prepare(`DELETE FROM subscriptions WHERE brand_id = ?1 AND id = (
    SELECT subscription_id FROM withdrawal_requests WHERE brand_id = ?1 AND id = ?2 AND status = 'pending'
  )`)
        .bind(brandId, id)
    )
  }
  statements.push(
    db
      .prepare(`UPDATE withdrawal_requests SET status = ?1, closed_at = ?2, closed_by = ?3, decision = ?4, case_reference = ?5
    WHERE brand_id = ?6 AND id = ?7 AND status = 'pending'
      AND (?4 <> 'already_absent' OR NOT EXISTS (SELECT 1 FROM subscriptions WHERE id = withdrawal_requests.subscription_id AND brand_id = withdrawal_requests.brand_id))`)
      .bind(approved ? 'completed' : 'dismissed', at, actor, decision, caseReference, brandId, id)
  )
  const results = await db.batch(statements)
  return results.at(-1)?.meta.changes === 1
}

const withdrawals = { list, get, resolve } as const

export { withdrawals }
