import { env } from 'cloudflare:workers'
import type { PublicEnv } from '#lib/server/public-env.ts'

/** The Worker bindings, which the Cloudflare adapter supplies on every request. */
const bindings = (): PublicEnv => {
  const workerEnv = env as unknown as PublicEnv
  if (!(workerEnv.DB && workerEnv.SUBSCRIBE_LIMITER)) {
    throw new Error('Cloudflare bindings are missing; this app only runs on Workers')
  }
  return workerEnv
}

export { bindings }
