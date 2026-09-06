import { fail, type RequestEvent } from '@sveltejs/kit'
import { bindings } from '$lib/server/bindings'
import { vault } from '$lib/server/crypto'
import { normaliseEmail } from '$lib/server/email'
import { secrets } from '$lib/server/secrets'
import { store } from '$lib/server/store'

const badRequest = 400
const tooManyRequests = 429

/**
 * The join form action. Order: honeypot, email syntax, rate limit, then the
 * write. The answer is the same whether the address is new or already on the
 * list, so the list cannot be enumerated. SvelteKit refuses cross-origin form
 * posts before this runs.
 */
const join = async (event: RequestEvent) => {
  const data = await event.request.formData()
  if (String(data.get('website') ?? '') !== '') {
    return { joined: true }
  }
  const email = normaliseEmail(data.get('email'))
  if (!email) {
    return fail(badRequest, { error: 'invalid_email' as const })
  }
  const env = bindings(event)
  const { brand } = event.locals
  const client = event.getClientAddress() || 'unknown'
  const { success } = await env.SUBSCRIBE_LIMITER.limit({ key: `${brand.id}:${client}` })
  if (!success) {
    return fail(tooManyRequests, { error: 'rate_limited' as const })
  }
  const keys = secrets(env)
  const encrypted = await vault.encrypt(email.submitted, keys.currentKey)
  await store.insert(env.DB, {
    id: crypto.randomUUID(),
    brand_id: brand.id,
    email_ciphertext: encrypted.ciphertext,
    email_iv: encrypted.iv,
    email_digest: await vault.hmac(`${brand.id}\n${email.canonical}`, keys.digestKey),
    encryption_key_version: keys.currentVersion,
    consent_version: brand.consentVersion,
    joined_at: new Date().toISOString()
  })
  return { joined: true }
}

export { join }
