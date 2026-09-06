import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import admin from '../../../src/admin-worker.ts'
import { vault } from '../../../src/lib/server/crypto.ts'
import { localSecrets } from '../../local-secrets.ts'
import { environment } from '../environment.ts'

const teamDomain = 'example.cloudflareaccess.com'
const audience = 'test-audience'
const origin = 'https://lists.futhr.io'
const encoder = new TextEncoder()
const padding = /[=]+$/
const modulusLength = 2048
const tenMinutes = 600
const first = '11111111-1111-4111-8111-111111111111'
const second = '22222222-2222-4222-8222-222222222222'
const third = '33333333-3333-4333-8333-333333333333'
let keyPair: CryptoKeyPair
let publicJwk: JsonWebKey & { kid: string }

interface Listing {
  items: Array<{ id: string; email: string; brand: string }>
  next_cursor: string | null
}

const base64url = (input: ArrayBuffer | string) => {
  const bytes = typeof input === 'string' ? encoder.encode(input) : new Uint8Array(input)
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(padding, '')
}

const jwtFor = async (identity: string, overrides: Record<string, unknown> = {}) => {
  const now = Math.floor(Date.now() / 1000)
  const head = base64url(JSON.stringify({ alg: 'RS256', kid: 'key-1' }))
  const body = base64url(
    JSON.stringify({
      iss: `https://${teamDomain}`,
      aud: [audience],
      exp: now + tenMinutes,
      iat: now,
      ...(identity.includes('@') ? { email: identity } : { common_name: identity }),
      ...overrides
    })
  )
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    keyPair.privateKey,
    encoder.encode(`${head}.${body}`)
  )
  return `${head}.${body}.${base64url(signature)}`
}

const as = async (identity: string, path: string, init: RequestInit = {}) =>
  admin.fetch(
    new Request(`${origin}${path}`, {
      ...init,
      headers: { ...init.headers, 'cf-access-jwt-assertion': await jwtFor(identity) }
    }),
    environment
  )

const seed = async (input: {
  id: string
  brandId: string
  email: string
  keyVersion?: string
  joinedAt?: string
}) => {
  const version = input.keyVersion ?? 'v1'
  const key = version === 'v2' ? localSecrets.EMAIL_KEY_V2 : localSecrets.EMAIL_KEY_V1
  const encrypted = await vault.encrypt(input.email, key)
  const digest = await vault.hmac(
    `${input.brandId}\n${input.email.toLowerCase()}`,
    environment.EMAIL_DIGEST_KEY
  )
  await environment.DB.prepare(
    `INSERT INTO subscriptions (id, brand_id, email_ciphertext, email_iv, email_digest,
       encryption_key_version, consent_version, joined_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, '2026-09-05', ?7)`
  )
    .bind(
      input.id,
      input.brandId,
      encrypted.ciphertext,
      encrypted.iv,
      digest,
      version,
      input.joinedAt ?? new Date().toISOString()
    )
    .run()
}

const audit = async () =>
  (
    await environment.DB.prepare('SELECT action, actor FROM audit_log ORDER BY at, id').all<{
      action: string
      actor: string
    }>()
  ).results.map(({ actor, action }) => `${actor}:${action}`)

beforeAll(async () => {
  keyPair = (await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256'
    },
    true,
    ['sign', 'verify']
  )) as CryptoKeyPair
  publicJwk = {
    ...((await crypto.subtle.exportKey('jwk', keyPair.publicKey)) as JsonWebKey),
    kid: 'key-1'
  }
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const stubCertificates = () =>
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = input instanceof Request ? input.url : String(input)
      return Promise.resolve(
        url === `https://${teamDomain}/cdn-cgi/access/certs`
          ? Response.json({ keys: [publicJwk] })
          : new Response('not found', { status: 404 })
      )
    })
  )

describe('admin API', () => {
  it('requires a valid Access assertion', async () => {
    stubCertificates()
    expect((await admin.fetch(new Request(`${origin}/v1/brands`), environment)).status).toBe(401)
    const wrongAudience = await admin.fetch(
      new Request(`${origin}/v1/brands`, {
        headers: { 'cf-access-jwt-assertion': await jwtFor('owner@example.com', { aud: 'other' }) }
      }),
      environment
    )
    expect(wrongAudience.status).toBe(401)
    const unknownIdentity = await as('nobody@example.com', '/v1/brands')
    expect(unknownIdentity.status).toBe(200)
    expect(await unknownIdentity.json()).toEqual([])
  })

  it('scopes every operation to the granted brands', async () => {
    stubCertificates()
    const owner = await as('owner@example.com', '/v1/brands')
    expect(((await owner.json()) as unknown[]).length).toBe(5)
    expect(owner.headers.get('cache-control')).toBe('no-store')
    const bot = await as('rivure-bot', '/v1/brands')
    expect(await bot.json()).toEqual([{ id: 'rivure', host: 'rivure.com', name: 'Rivure' }])
    expect((await as('rivure-bot', '/v1/brands/diggymon/subscriptions')).status).toBe(403)
    expect((await as('rivure-bot', '/v1/brands/rivure/subscriptions')).status).toBe(200)
    expect((await as('owner@example.com', '/v1/brands/nope/subscriptions')).status).toBe(403)
    expect((await as('owner@example.com', '/v1/brands/rivure/exports')).status).toBe(404)
    expect((await as('owner@example.com', '/v2/brands')).status).toBe(404)
    expect((await as('owner@example.com', '/v1/brands', { method: 'DELETE' })).status).toBe(405)
    expect(
      (await as('owner@example.com', '/v1/brands/rivure/subscriptions', { method: 'POST' })).status
    ).toBe(405)
  })

  it('lists addresses in join order, paginates, deletes, and audits', async () => {
    stubCertificates()
    await seed({
      id: first,
      brandId: 'rivure',
      email: 'a@example.com',
      joinedAt: '2026-09-01T00:00:00.000Z'
    })
    await seed({
      id: second,
      brandId: 'rivure',
      email: 'b@example.com',
      joinedAt: '2026-09-02T00:00:00.000Z'
    })
    await seed({ id: third, brandId: 'diggymon', email: 'c@example.com' })

    const page = (await (
      await as('owner@example.com', '/v1/brands/rivure/subscriptions?limit=1')
    ).json()) as Listing
    expect(page.items).toEqual([
      expect.objectContaining({ id: first, brand: 'rivure', email: 'a@example.com' })
    ])
    expect(page.next_cursor).toBeTruthy()
    const rest = (await (
      await as(
        'owner@example.com',
        `/v1/brands/rivure/subscriptions?limit=1&cursor=${page.next_cursor}`
      )
    ).json()) as Listing
    expect(rest.items.map(({ email }) => email)).toEqual(['b@example.com'])
    expect(rest.next_cursor).toBeNull()

    expect(
      (await as('rivure-bot', `/v1/brands/rivure/subscriptions/${third}`, { method: 'DELETE' }))
        .status
    ).toBe(404)
    expect(
      (await as('rivure-bot', `/v1/brands/rivure/subscriptions/${first}`, { method: 'DELETE' }))
        .status
    ).toBe(204)
    expect(
      (await as('rivure-bot', `/v1/brands/rivure/subscriptions/${first}`, { method: 'DELETE' }))
        .status
    ).toBe(404)
    expect(
      (await as('rivure-bot', '/v1/brands/rivure/subscriptions/not-a-uuid', { method: 'DELETE' }))
        .status
    ).toBe(404)
    const remaining = (await (
      await as('owner@example.com', '/v1/brands/rivure/subscriptions')
    ).json()) as Listing
    expect(remaining.items.map(({ id }) => id)).toEqual([second])
    expect(await audit()).toEqual([
      'owner@example.com:subscriptions.list',
      'owner@example.com:subscriptions.list',
      'rivure-bot:subscription.delete',
      'owner@example.com:subscriptions.list'
    ])
  })

  it('decrypts rows written under an older key version', async () => {
    stubCertificates()
    await seed({ id: first, brandId: 'refpath', email: 'old@example.com', keyVersion: 'v2' })
    await seed({ id: second, brandId: 'refpath', email: 'new@example.com' })
    const page = (await (
      await as('owner@example.com', '/v1/brands/refpath/subscriptions')
    ).json()) as Listing
    expect(page.items.map(({ email }) => email)).toEqual(['old@example.com', 'new@example.com'])
  })
})
