import { withdrawalPolicy } from '$lib/server/withdrawal-policy'

/** Queue matching subscriptions only. Capacity and insertion share one transaction. */
const requestWithdrawal = async (db: D1Database, brandId: string, digest: string) => {
  const [capacity] = await db.batch([
    db
      .prepare(
        "SELECT COUNT(*) AS total FROM withdrawal_requests WHERE brand_id = ?1 AND status = 'pending'"
      )
      .bind(brandId),
    db
      .prepare(`INSERT INTO withdrawal_requests (id, brand_id, subscription_id, requested_at)
      SELECT ?1, brand_id, id, ?2 FROM subscriptions
      WHERE brand_id = ?3 AND email_digest = ?4
      AND (SELECT COUNT(*) FROM withdrawal_requests WHERE brand_id = ?3 AND status = 'pending') < ?5
      ON CONFLICT DO NOTHING`)
      .bind(
        crypto.randomUUID(),
        new Date().toISOString(),
        brandId,
        digest,
        withdrawalPolicy.maxPending
      )
  ])
  const total = (capacity?.results[0] as { total: number } | undefined)?.total
  // Full queues fail for every address, including non-members and duplicates.
  return typeof total === 'number' && total < withdrawalPolicy.maxPending
}

export { requestWithdrawal }
