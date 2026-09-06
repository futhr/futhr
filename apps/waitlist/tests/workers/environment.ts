import { type D1Migration, env } from 'cloudflare:test'
import type { AdminEnv } from '../../src/lib/server/admin/env.ts'
import type { PublicEnv } from '../../src/lib/server/public-env.ts'

/**
 * The test bindings, typed by hand. Each project only has the half its
 * Worker declares; the public tests use PublicEnv, the admin tests AdminEnv.
 */
const environment = env as unknown as PublicEnv &
  AdminEnv & { readonly TEST_MIGRATIONS: D1Migration[] }

export { environment }
