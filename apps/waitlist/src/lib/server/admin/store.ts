import type { SubscriptionRow } from '$lib/server/subscription-row'

interface ListPage {
  readonly items: readonly SubscriptionRow[]
  readonly nextCursor: string | null
}

const maxPageSize = 200

const encodeCursor = (joinedAt: string, id: string) => btoa(`${joinedAt}|${id}`)

const decodeCursor = (cursor: string | null): [string, string] | null => {
  if (!cursor) {
    return null
  }
  try {
    const [joinedAt, id] = atob(cursor).split('|')
    return joinedAt && id ? [joinedAt, id] : null
  } catch {
    return null
  }
}

/** One brand's rows in join order, keyset-paginated on (joined_at, id). */
const list = async (
  db: D1Database,
  brandId: string,
  options: { cursor: string | null; limit: number }
): Promise<ListPage> => {
  const limit = Math.min(Math.max(options.limit, 1), maxPageSize)
  const cursor = decodeCursor(options.cursor)
  const statement = cursor
    ? db
        .prepare(
          `SELECT * FROM subscriptions
           WHERE brand_id = ?1 AND (joined_at, id) > (?2, ?3)
           ORDER BY joined_at, id LIMIT ?4`
        )
        .bind(brandId, cursor[0], cursor[1], limit + 1)
    : db
        .prepare('SELECT * FROM subscriptions WHERE brand_id = ?1 ORDER BY joined_at, id LIMIT ?2')
        .bind(brandId, limit + 1)
  const rows = (await statement.all<SubscriptionRow>()).results
  const items = rows.slice(0, limit)
  const last = items.at(-1)
  return {
    items,
    nextCursor: rows.length > limit && last ? encodeCursor(last.joined_at, last.id) : null
  }
}

/** Audit and delete in one transaction; a failed audit leaves the address intact. */
const remove = async (
  db: D1Database,
  brandId: string,
  id: string,
  actor: string
): Promise<boolean> => {
  const [, result] = await db.batch([
    db
      .prepare(
        `INSERT INTO audit_log (id, at, actor, action, brand_id, subject_id)
         SELECT ?1, ?2, ?3, 'subscription.delete', brand_id, id FROM subscriptions
         WHERE brand_id = ?4 AND id = ?5`
      )
      .bind(crypto.randomUUID(), new Date().toISOString(), actor, brandId, id),
    db.prepare('DELETE FROM subscriptions WHERE brand_id = ?1 AND id = ?2').bind(brandId, id)
  ])
  return result?.meta.changes === 1
}

const audit = (
  db: D1Database,
  entry: { actor: string; action: string; brandId: string; subjectId: string | null; at: string }
) =>
  db
    .prepare(
      'INSERT INTO audit_log (id, at, actor, action, brand_id, subject_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6)'
    )
    .bind(crypto.randomUUID(), entry.at, entry.actor, entry.action, entry.brandId, entry.subjectId)
    .run()

/** The administrative statements: listing, deleting, auditing. */
const adminStore = { list, remove, audit } as const

export { adminStore }
