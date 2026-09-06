import type { SubscriptionRow } from '$lib/server/subscription-row'

/** Inserts a row; false when the brand already holds this address. */
const insert = async (db: D1Database, row: SubscriptionRow): Promise<boolean> => {
  const result = await db
    .prepare(
      `INSERT INTO subscriptions (
         id, brand_id, email_ciphertext, email_iv, email_digest,
         encryption_key_version, consent_version, joined_at
       ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
       ON CONFLICT (brand_id, email_digest) DO NOTHING`
    )
    .bind(
      row.id,
      row.brand_id,
      row.email_ciphertext,
      row.email_iv,
      row.email_digest,
      row.encryption_key_version,
      row.consent_version,
      row.joined_at
    )
    .run()
  return result.meta.changes === 1
}

/** The public Worker's only statement. Reads live behind the admin Worker. */
const store = { insert } as const

export { store }
