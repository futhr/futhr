const certsTtlMs = 10 * 60 * 1000
const clockSkewSeconds = 60
const millisecondsPerSecond = 1000
const jwtPattern = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/
const certsCache = new Map<string, { keys: AccessKey[]; fetchedAt: number }>()

/** One entry of the team's published JWKS. */
interface AccessKey {
  readonly kid?: string
  readonly kty?: string
  readonly n?: string
  readonly e?: string
}

interface AccessHeader {
  readonly alg?: unknown
  readonly kid?: unknown
}

interface AccessClaims {
  readonly iss?: string
  readonly aud?: string | string[]
  readonly exp?: number
  readonly nbf?: number
  readonly iat?: number
  readonly email?: string
  readonly common_name?: string
  readonly sub?: string
}

interface AccessIdentity {
  readonly identity: string
  readonly claims: AccessClaims
}

interface AccessOptions {
  readonly teamDomain: string
  readonly audience: string
  readonly now?: number
}

interface ParsedToken {
  readonly header: AccessHeader
  readonly claims: AccessClaims
  readonly signature: Uint8Array<ArrayBuffer>
  readonly signed: Uint8Array<ArrayBuffer>
}

const decodeSegment = (segment: string): Uint8Array<ArrayBuffer> => {
  const padded = segment.replaceAll('-', '+').replaceAll('_', '/')
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4))
  const bytes = new Uint8Array(new ArrayBuffer(binary.length))
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

/** Copies any view into a fresh ArrayBuffer-backed array, which both runtime libraries accept. */
const toBuffer = (view: Uint8Array): Uint8Array<ArrayBuffer> => {
  const copy = new Uint8Array(new ArrayBuffer(view.byteLength))
  copy.set(view)
  return copy
}

const decodeJson = <T>(segment: string): T =>
  JSON.parse(new TextDecoder().decode(decodeSegment(segment))) as T

const parseToken = (token: string): ParsedToken | null => {
  const [headerSegment, payloadSegment, signatureSegment] = token.split('.') as [
    string,
    string,
    string
  ]
  try {
    return {
      header: decodeJson<AccessHeader>(headerSegment),
      claims: decodeJson<AccessClaims>(payloadSegment),
      signature: decodeSegment(signatureSegment),
      signed: toBuffer(new TextEncoder().encode(`${headerSegment}.${payloadSegment}`))
    }
  } catch {
    return null
  }
}

const certificates = async (teamDomain: string, now: number): Promise<AccessKey[]> => {
  const cached = certsCache.get(teamDomain)
  if (cached && now - cached.fetchedAt < certsTtlMs) {
    return cached.keys
  }
  const response = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`)
  if (!response.ok) {
    throw new Error(`Access certificates unavailable (${response.status})`)
  }
  const body = (await response.json()) as { keys?: AccessKey[] }
  const keys = body.keys ?? []
  certsCache.set(teamDomain, { keys, fetchedAt: now })
  return keys
}

const signatureValid = async (parsed: ParsedToken, candidate: AccessKey): Promise<boolean> => {
  if (!(candidate.n && candidate.e)) {
    return false
  }
  const key = await crypto.subtle.importKey(
    'jwk',
    { kty: 'RSA', n: candidate.n, e: candidate.e, alg: 'RS256', ext: true },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  )
  return crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, parsed.signature, parsed.signed)
}

const claimsAccepted = (claims: AccessClaims, options: AccessOptions, now: number): boolean => {
  const seconds = Math.floor(now / millisecondsPerSecond)
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud]
  const notYetValid = typeof claims.nbf === 'number' && claims.nbf > seconds + clockSkewSeconds
  const issuedInFuture = typeof claims.iat === 'number' && claims.iat > seconds + clockSkewSeconds
  return (
    claims.iss === `https://${options.teamDomain}` &&
    audiences.includes(options.audience) &&
    typeof claims.exp === 'number' &&
    claims.exp > seconds &&
    !(notYetValid || issuedInFuture)
  )
}

/**
 * Validates a `Cf-Access-Jwt-Assertion` token: RS256 signature against the
 * team's published keys, issuer, application audience, and time claims. The
 * identity is the user email or, for service tokens, the common name.
 */
const verifyAccessJwt = async (
  token: string | null,
  options: AccessOptions
): Promise<AccessIdentity | null> => {
  if (!(token && jwtPattern.test(token) && options.teamDomain && options.audience)) {
    return null
  }
  const parsed = parseToken(token)
  if (!parsed) {
    return null
  }
  if (parsed.header.alg !== 'RS256' || typeof parsed.header.kid !== 'string') {
    return null
  }
  const now = options.now ?? Date.now()
  const keyId = parsed.header.kid
  const candidate = (await certificates(options.teamDomain, now)).find(
    (entry) => entry.kid === keyId && entry.kty === 'RSA'
  )
  if (!candidate) {
    return null
  }
  if (!(await signatureValid(parsed, candidate))) {
    return null
  }
  if (!claimsAccepted(parsed.claims, options, now)) {
    return null
  }
  const identity = parsed.claims.email ?? parsed.claims.common_name
  return identity ? { identity, claims: parsed.claims } : null
}

export { verifyAccessJwt }
