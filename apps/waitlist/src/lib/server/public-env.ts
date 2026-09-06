/** Bindings, variables, and secrets of the public Worker (wrangler.toml). */
interface PublicEnv {
  readonly ASSETS: Fetcher
  readonly DB: D1Database
  readonly SUBSCRIBE_LIMITER: RateLimit
  readonly WAITLIST_ENVIRONMENT: string
  readonly EMAIL_KEY_VERSION: string
  readonly EMAIL_DIGEST_KEY: string
  readonly [key: `EMAIL_KEY_${string}`]: string | undefined
}

export type { PublicEnv }
