import { describe, expect, it } from 'vitest'
import { vault } from '../../src/lib/server/crypto.ts'
import { localSecrets } from '../local-secrets.ts'

const key = localSecrets.EMAIL_KEY_V1
const otherKey = localSecrets.EMAIL_KEY_V2
const keyLengthError = /32 bytes/
const noncePattern = /^[A-Za-z0-9+/]{22}==$/

describe('vault', () => {
  it('round-trips AES-GCM with a fresh IV per call and rejects the wrong key', async () => {
    const first = await vault.encrypt('person@example.com', key)
    const second = await vault.encrypt('person@example.com', key)
    expect(first.iv).not.toBe(second.iv)
    expect(first.ciphertext).not.toBe(second.ciphertext)
    expect(await vault.decrypt(first, key)).toBe('person@example.com')
    await expect(vault.decrypt(first, otherKey)).rejects.toThrow()
    await expect(vault.encrypt('x', 'c2hvcnQ=')).rejects.toThrow(keyLengthError)
  })

  it('produces keyed digests that are stable per key and differ per brand', async () => {
    const digest = await vault.hmac('rivure\nperson@example.com', key)
    expect(digest).toBe(await vault.hmac('rivure\nperson@example.com', key))
    expect(digest).not.toBe(await vault.hmac('rivure\nperson@example.com', otherKey))
    expect(digest).not.toBe(await vault.hmac('diggymon\nperson@example.com', key))
  })

  it('issues base64 nonces', () => {
    expect(vault.randomNonce()).toMatch(noncePattern)
    expect(vault.randomNonce()).not.toBe(vault.randomNonce())
  })
})
