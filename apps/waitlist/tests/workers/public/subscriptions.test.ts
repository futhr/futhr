import { describe, expect, it } from 'vitest'
import { vault } from '../../../src/lib/server/crypto.ts'
import { localSecrets } from '../../local-secrets.ts'
import { environment } from '../environment.ts'
import { helpers } from './helpers.ts'

const { join, rows } = helpers
const host = 'rivure.com'
const rateLimit = 5

describe('the join form action', () => {
  it('refuses cross-origin posts and invalid addresses before anything else', async () => {
    const foreign = await join(
      host,
      { email: 'a@example.com' },
      { headers: { origin: 'https://evil.example' } }
    )
    expect(foreign.status).toBe(403)
    const invalid = await join(host, { email: 'not-an-email' })
    expect(invalid.status).toBe(400)
    expect(await invalid.text()).toContain('Enter a valid email address.')
    expect(invalid.headers.get('cache-control')).toBe('no-store')
    expect((await join(host, {})).status).toBe(400)
    expect(await rows()).toHaveLength(0)
  })

  it('answers a filled honeypot like a success and stores nothing', async () => {
    const response = await join(host, { email: 'bot@example.com', website: 'https://spam.example' })
    expect(response.status).toBe(200)
    expect(await response.text()).toContain('You are on the list')
    expect(await rows()).toHaveLength(0)
  })

  it('stores an encrypted record with the consent version and renders the joined state', async () => {
    const response = await join(host, { email: ' Person@Example.com ' })
    expect(response.status).toBe(200)
    const html = await response.text()
    expect(html).toContain('You are on the list')
    expect(html).not.toContain('join-form-email')
    const [stored] = await rows()
    expect(stored?.brand_id).toBe('rivure')
    expect(stored?.consent_version).toBe('2026-09-06.1')
    expect(stored?.encryption_key_version).toBe('v1')
    expect(stored?.joined_at).toBeTruthy()
    expect(stored?.email_ciphertext).not.toContain('example.com')
    expect(
      await vault.decrypt(
        { ciphertext: stored?.email_ciphertext ?? '', iv: stored?.email_iv ?? '' },
        localSecrets.EMAIL_KEY_V1
      )
    ).toBe('Person@Example.com')
    expect(stored?.email_digest).toBe(
      await vault.hmac('rivure\nperson@example.com', environment.EMAIL_DIGEST_KEY)
    )
  })

  it('answers the same for a repeat and keeps one row per address', async () => {
    const first = await join(host, { email: 'person@example.com' })
    const second = await join(host, { email: 'PERSON@example.com' })
    expect([first.status, second.status]).toEqual([200, 200])
    expect(await rows()).toHaveLength(1)
  })

  it('keeps the same address separate per brand', async () => {
    await join(host, { email: 'person@example.com' })
    await join('orvane.io', { email: 'person@example.com' })
    const stored = await rows()
    expect(stored.map(({ brand_id }) => brand_id)).toEqual(['rivure', 'orvane'])
    expect(stored[0]?.email_digest).not.toBe(stored[1]?.email_digest)
  })

  it('survives concurrent duplicate submissions', async () => {
    const responses = await Promise.all(
      Array.from({ length: 4 }, () => join(host, { email: 'race@example.com' }))
    )
    expect(responses.map(({ status }) => status)).toEqual([200, 200, 200, 200])
    expect(await rows()).toHaveLength(1)
  })

  it('rate limits a single client per brand', async () => {
    const client = { client: '203.0.113.7' }
    const statuses: number[] = []
    for (let attempt = 0; attempt <= rateLimit; attempt += 1) {
      statuses.push((await join(host, { email: `r${attempt}@example.com` }, client)).status)
    }
    expect(statuses.slice(0, rateLimit)).toEqual(Array.from({ length: rateLimit }, () => 200))
    expect(statuses.at(-1)).toBe(429)
    expect(await (await join(host, { email: 'r9@example.com' }, client)).text()).toContain(
      'Too many attempts'
    )
  })
})

it('rejects an oversized form before parsing or storing an address', async () => {
  const response = await join(host, { email: 'a@example.com', extra: 'x'.repeat(8192) })
  expect(response.status).toBe(413)
  expect(await rows()).toHaveLength(0)
})

it('rejects malformed multipart input as a client error', async () => {
  const response = await helpers.call(`https://${host}/`, {
    method: 'POST',
    headers: { origin: `https://${host}`, 'content-type': 'multipart/form-data' },
    body: 'not multipart'
  })
  expect(response.status).toBe(400)
  expect(await rows()).toHaveLength(0)
})
