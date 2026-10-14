import { fail, type RequestEvent } from '@sveltejs/kit'
import { bindings } from '#lib/server/bindings.ts'
import { vault } from '#lib/server/crypto.ts'
import { normaliseEmail } from '#lib/server/email.ts'
import { joinData } from '#lib/server/join-data.ts'
import { requestWithdrawal } from '#lib/server/request-store.ts'
import { secrets } from '#lib/server/secrets.ts'

/** Receive a request, never delete or suspend a subscription. */
const withdraw = async (event: RequestEvent) => {
  const data = await joinData(event.request)
  if (String(data.get('website') ?? '') !== '') {
    return { requested: true }
  }
  const email = normaliseEmail(data.get('email'))
  if (!email) {
    return fail(400, { error: 'invalid_email' as const })
  }
  const env = bindings()
  const { brand } = event.locals
  const client = event.getClientAddress() || 'unknown'
  const { success } = await env.SUBSCRIBE_LIMITER.limit({ key: `withdraw:${brand.id}:${client}` })
  if (!success) {
    return fail(429, { error: 'rate_limited' as const })
  }
  try {
    const digest = await vault.hmac(`${brand.id}\n${email.canonical}`, secrets(env).digestKey)
    if (!(await requestWithdrawal(env.DB, brand.id, digest))) {
      return fail(503, { error: 'unavailable' as const })
    }
  } catch {
    console.error('withdrawal request failed')
    return fail(503, { error: 'unavailable' as const })
  }
  return { requested: true }
}

export { withdraw }
