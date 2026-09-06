/** One row of the subscriptions table, as D1 returns it. */
interface SubscriptionRow {
  readonly id: string
  readonly brand_id: string
  readonly email_ciphertext: string
  readonly email_iv: string
  readonly email_digest: string
  readonly encryption_key_version: string
  readonly consent_version: string
  readonly joined_at: string
}

export type { SubscriptionRow }
