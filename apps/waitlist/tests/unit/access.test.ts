import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { verifyAccessJwt } from '../../src/lib/server/admin/access.ts'

const teamDomain = 'example.cloudflareaccess.com'
const audience = 'aud-tag'
const encoder = new TextEncoder()
const padding = /[=]+$/
const tenMinutes = 600
const modulusLength = 2048
let keyPair: CryptoKeyPair
let publicJwk: JsonWebKey & { kid: string }

const base64url = (input: ArrayBuffer | string) => {
  const bytes = typeof input === 'string' ? encoder.encode(input) : new Uint8Array(input)
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(padding, '')
}

const sign = async (claims: unknown, header: Record<string, unknown> | null = {}) => {
  const head = base64url(
    JSON.stringify(header === null ? null : { alg: 'RS256', kid: 'key-1', ...header })
  )
  const body = base64url(JSON.stringify(claims))
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    keyPair.privateKey,
    encoder.encode(`${head}.${body}`)
  )
  return `${head}.${body}.${base64url(signature)}`
}

const now = Math.floor(Date.now() / 1000)
const validClaims = {
  iss: `https://${teamDomain}`,
  aud: [audience],
  exp: now + tenMinutes,
  iat: now - 10,
  email: 'owner@example.com'
}

beforeAll(async () => {
  keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256'
    },
    true,
    ['sign', 'verify']
  )
  publicJwk = { ...(await crypto.subtle.exportKey('jwk', keyPair.publicKey)), kid: 'key-1' }
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) =>
      Promise.resolve(
        url === `https://${teamDomain}/cdn-cgi/access/certs`
          ? Response.json({ keys: [publicJwk] })
          : new Response('not found', { status: 404 })
      )
    )
  )
})

afterEach(() => {
  vi.clearAllMocks()
})

afterAll(() => vi.unstubAllGlobals())

describe('verifyAccessJwt', () => {
  it('accepts a signed token for the right issuer and audience and caches the keys', async () => {
    const result = await verifyAccessJwt(await sign(validClaims), { teamDomain, audience })
    expect(result?.identity).toBe('owner@example.com')
    const again = await verifyAccessJwt(
      await sign({ ...validClaims, email: undefined, common_name: 'svc' }),
      { teamDomain, audience }
    )
    expect(again?.identity).toBe('svc')
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('rejects wrong audience, issuer, expiry, algorithm, key id, and signature', async () => {
    const options = { teamDomain, audience }
    expect(await verifyAccessJwt(await sign({ ...validClaims, aud: 'other' }), options)).toBeNull()
    expect(
      await verifyAccessJwt(await sign({ ...validClaims, iss: 'https://evil.example' }), options)
    ).toBeNull()
    expect(await verifyAccessJwt(await sign({ ...validClaims, exp: now - 1 }), options)).toBeNull()
    expect(await verifyAccessJwt(await sign(validClaims, { alg: 'HS256' }), options)).toBeNull()
    expect(await verifyAccessJwt(await sign(validClaims, { kid: 'unknown' }), options)).toBeNull()
    const [head, body] = (await sign(validClaims)).split('.')
    expect(await verifyAccessJwt(`${head}.${body}.AAAA`, options)).toBeNull()
    expect(
      await verifyAccessJwt(await sign({ ...validClaims, email: undefined }), options)
    ).toBeNull()
    expect(await verifyAccessJwt('garbage', options)).toBeNull()
    expect(await verifyAccessJwt(null, options)).toBeNull()
    expect(await verifyAccessJwt(await sign(validClaims), { teamDomain, audience: '' })).toBeNull()
  })
})

const invalidClaims = [
  null,
  [],
  'invalid',
  { ...validClaims, exp: undefined },
  { ...validClaims, exp: 'tomorrow' },
  { ...validClaims, email: { name: 'owner@example.com' } },
  { ...validClaims, email: '' },
  { ...validClaims, nbf: now + 120 },
  { ...validClaims, nbf: 'later' },
  { ...validClaims, iat: now + 120 },
  { ...validClaims, iat: 'yesterday' }
]

it.each(invalidClaims)('rejects malformed or premature claims: %j', async (claims) => {
  expect(await verifyAccessJwt(await sign(claims), { teamDomain, audience })).toBeNull()
})

it.each([null, { crit: ['unknown'], unknown: true }])(
  'rejects an invalid header: %j',
  async (header) => {
    expect(
      await verifyAccessJwt(await sign(validClaims, header), { teamDomain, audience })
    ).toBeNull()
  }
)
