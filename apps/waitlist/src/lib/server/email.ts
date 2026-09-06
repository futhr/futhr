const maxLength = 254
const maxLocalLength = 64
const localPattern = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/
const labelPattern = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/
const topLevelPattern = /^[A-Za-z]{2,63}$/
const whitespacePattern = /\s/
const lastControlCode = 31
const deleteCode = 127

const hasControlCharacter = (value: string): boolean =>
  Array.from(value).some((character) => {
    const code = character.codePointAt(0) ?? 0
    return code <= lastControlCode || code === deleteCode
  })

/**
 * Conservative syntax check. The submitted mailbox is preserved as typed;
 * the canonical form (NFC, lower-case, trimmed) is what duplicate detection
 * digests. Lower-casing the local part is a documented simplification.
 */
const normaliseEmail = (input: unknown): { submitted: string; canonical: string } | undefined => {
  if (typeof input !== 'string') {
    return undefined
  }
  const submitted = input.trim().normalize('NFC')
  if (
    submitted.length < 6 ||
    submitted.length > maxLength ||
    whitespacePattern.test(submitted) ||
    hasControlCharacter(submitted)
  ) {
    return undefined
  }
  const at = submitted.lastIndexOf('@')
  if (at < 1 || submitted.indexOf('@') !== at) {
    return undefined
  }
  const local = submitted.slice(0, at)
  const domain = submitted.slice(at + 1)
  if (local.length > maxLocalLength || !localPattern.test(local)) {
    return undefined
  }
  const labels = domain.split('.')
  if (labels.length < 2 || !labels.every((label) => labelPattern.test(label))) {
    return undefined
  }
  if (!topLevelPattern.test(labels.at(-1) ?? '')) {
    return undefined
  }
  return { submitted, canonical: submitted.toLowerCase() }
}

export { normaliseEmail }
