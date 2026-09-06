const encoder = new TextEncoder()
const decoder = new TextDecoder()
const aesKeyBytes = 32
const ivBytes = 12
const nonceBytes = 16
const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/
const padding = /[=]+$/
const keyCache = new Map<string, Promise<CryptoKey>>()

type Bytes = Uint8Array<ArrayBuffer>

const toBase64 = (bytes: Uint8Array): string => btoa(String.fromCharCode(...bytes))

const fromBase64 = (value: string): Bytes => {
  if (!base64Pattern.test(value)) {
    throw new Error('Value is not base64')
  }
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0))
}

const toBase64Url = (bytes: Uint8Array): string =>
  toBase64(bytes).replaceAll('+', '-').replaceAll('/', '_').replace(padding, '')

const randomBytes = (length: number): Bytes => crypto.getRandomValues(new Uint8Array(length))

const cachedKey = (cacheKey: string, create: () => Promise<CryptoKey>): Promise<CryptoKey> => {
  let key = keyCache.get(cacheKey)
  if (!key) {
    key = create()
    keyCache.set(cacheKey, key)
  }
  return key
}

const aesKey = (secret: string): Promise<CryptoKey> =>
  cachedKey(`aes:${secret}`, () => {
    const bytes = fromBase64(secret)
    if (bytes.length !== aesKeyBytes) {
      throw new Error('Encryption keys must be 32 bytes, base64 encoded')
    }
    return crypto.subtle.importKey('raw', bytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
  })

const hmacKey = (secret: string): Promise<CryptoKey> =>
  cachedKey(`hmac:${secret}`, () =>
    crypto.subtle.importKey('raw', fromBase64(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
      'sign'
    ])
  )

/** AES-256-GCM with a fresh 96-bit IV per value. Both parts are base64. */
const encrypt = async (
  plaintext: string,
  secret: string
): Promise<{ ciphertext: string; iv: string }> => {
  const iv = randomBytes(ivBytes)
  const key = await aesKey(secret)
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  )
  return { ciphertext: toBase64(new Uint8Array(ciphertext)), iv: toBase64(iv) }
}

const decrypt = async (
  value: { ciphertext: string; iv: string },
  secret: string
): Promise<string> => {
  const key = await aesKey(secret)
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(value.iv) },
    key,
    fromBase64(value.ciphertext)
  )
  return decoder.decode(plaintext)
}

/** Keyed digest for duplicate lookup: not reversible and not dictionary-testable without the key. */
const hmac = async (message: string, secret: string): Promise<string> => {
  const key = await hmacKey(secret)
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
  return toBase64Url(new Uint8Array(signature))
}

/** A CSP nonce: 128 random bits as base64. */
const randomNonce = (): string => toBase64(randomBytes(nonceBytes))

const vault = { encrypt, decrypt, hmac, randomNonce } as const

export { vault }
