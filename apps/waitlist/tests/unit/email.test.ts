import { describe, expect, it } from 'vitest'
import { normaliseEmail } from '../../src/lib/server/email.ts'

const nonBreakingSpace = String.fromCodePoint(0xa0)
const startOfHeading = String.fromCodePoint(0x01)
const deleteCharacter = String.fromCodePoint(0x7f)
const longLocalPart = 65
const longLabel = 64
const overLength = 250

describe('normaliseEmail', () => {
  it('keeps the submitted mailbox and lower-cases the canonical form', () => {
    expect(normaliseEmail('  Tobias.B@Example.COM ')).toEqual({
      submitted: 'Tobias.B@Example.COM',
      canonical: 'tobias.b@example.com'
    })
    expect(normaliseEmail("o'neil+list@sub.example.co.uk")?.canonical).toBe(
      "o'neil+list@sub.example.co.uk"
    )
  })

  it('rejects malformed, oversized, and unsafe input', () => {
    const cases: unknown[] = [
      undefined,
      42,
      '',
      'a@b',
      'no-at-sign.example.com',
      'two@@example.com',
      'two@at@example.com',
      'space in@example.com',
      'tab\t@example.com',
      `${'x'.repeat(longLocalPart)}@example.com`,
      `x@${'a'.repeat(longLabel)}.com`,
      'x@example',
      'x@example.c0m',
      'x@-example.com',
      'x@example-.com',
      '.dot@example.com',
      'dot.@example.com',
      'double..dot@example.com',
      'user@exämple.se',
      `${'a'.repeat(overLength)}@x.io`
    ]
    for (const input of cases) {
      expect(normaliseEmail(input), String(input)).toBeUndefined()
    }
  })

  it('treats non-breaking spaces and control characters as invalid', () => {
    expect(normaliseEmail(`x${nonBreakingSpace}y@example.com`)).toBeUndefined()
    expect(normaliseEmail(`x${startOfHeading}y@example.com`)).toBeUndefined()
    expect(normaliseEmail(`x${deleteCharacter}y@example.com`)).toBeUndefined()
  })
})
