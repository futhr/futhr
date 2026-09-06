/** Bindings, variables, and secrets of the admin Worker (wrangler.admin.toml). */
interface AdminEnv {
  readonly DB: D1Database
  readonly WAITLIST_ENVIRONMENT: string
  readonly ACCESS_TEAM_DOMAIN: string
  readonly ACCESS_AUDIENCE: string
  /** JSON object: identity (email or service-token client id) to brand ids or ["*"]. */
  readonly ADMIN_BRAND_GRANTS: string
  readonly EMAIL_KEY_VERSION: string
  readonly EMAIL_DIGEST_KEY: string
  readonly [key: `EMAIL_KEY_${string}`]: string | undefined
}

export type { AdminEnv }
