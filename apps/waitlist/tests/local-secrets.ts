/**
 * Key material for tests and local development only. Every value is a
 * placeholder; production secrets are set with `wrangler secret put`.
 * The AES keys decode to exactly 32 bytes; V2 stands in for an older key
 * version that rows may still name.
 */
const localSecrets = {
  EMAIL_KEY_VERSION: 'v1',
  EMAIL_KEY_V1: 'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=',
  EMAIL_KEY_V2: 'ZmVkY2JhOTg3NjU0MzIxMGZlZGNiYTk4NzY1NDMyMTA=',
  EMAIL_DIGEST_KEY: 'ZGlnZXN0LWtleS1kaWdlc3Qta2V5LWRpZ2VzdC1rZXk='
} as const

export { localSecrets }
