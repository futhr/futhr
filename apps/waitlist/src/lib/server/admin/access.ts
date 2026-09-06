import { createRemoteJWKSet, customFetch, errors, jwtVerify } from 'jose'

interface AccessOptions {
  readonly teamDomain: string
  readonly audience: string
  readonly now?: number
}

const clockSkewSeconds = 60
const millisecondsPerSecond = 1000
const teamDomainPattern = /^[a-z0-9-]+\.cloudflareaccess\.com$/
const keySets = new Map<string, ReturnType<typeof createRemoteJWKSet>>()

const keysFor = (teamDomain: string) => {
  let keys = keySets.get(teamDomain)
  if (!keys) {
    keys = createRemoteJWKSet(new URL(`https://${teamDomain}/cdn-cgi/access/certs`), {
      [customFetch]: (...args) => fetch(...args)
    })
    keySets.set(teamDomain, keys)
  }
  return keys
}

/** Verify Access signatures and claims; jose caches and refreshes the team's signing keys. */
const verifyAccessJwt = async (token: string | null, options: AccessOptions) => {
  if (!(token && teamDomainPattern.test(options.teamDomain) && options.audience)) {
    return null
  }
  const now = options.now ?? Date.now()
  try {
    const { payload } = await jwtVerify<{ email?: unknown; common_name?: unknown }>(
      token,
      keysFor(options.teamDomain),
      {
        algorithms: ['RS256'],
        issuer: `https://${options.teamDomain}`,
        audience: options.audience,
        requiredClaims: ['exp'],
        currentDate: new Date(now),
        clockTolerance: clockSkewSeconds
      }
    )
    const seconds = Math.floor(now / millisecondsPerSecond)
    if (
      typeof payload.exp !== 'number' ||
      payload.exp <= seconds ||
      (typeof payload.iat === 'number' && payload.iat > seconds + clockSkewSeconds)
    ) {
      return null
    }
    const identity = payload.email ?? payload.common_name
    return typeof identity === 'string' && identity.trim() !== '' ? { identity } : null
  } catch (error) {
    if (
      error instanceof errors.JWTExpired ||
      error instanceof errors.JWTInvalid ||
      error instanceof errors.JWSInvalid ||
      error instanceof errors.JWTClaimValidationFailed ||
      error instanceof errors.JOSEAlgNotAllowed ||
      error instanceof errors.JOSENotSupported ||
      error instanceof errors.JWKSNoMatchingKey ||
      error instanceof errors.JWSSignatureVerificationFailed
    ) {
      return null
    }
    throw error
  }
}

export { verifyAccessJwt }
