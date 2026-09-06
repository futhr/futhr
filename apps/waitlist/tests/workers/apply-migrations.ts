import { applyD1Migrations } from 'cloudflare:test'
import { beforeAll, beforeEach } from 'vitest'
import { environment } from './environment.ts'

// Isolated storage resets per test; migrations applied in beforeAll persist
// for the file, which is the documented pattern.
beforeAll(async () => {
  await applyD1Migrations(environment.DB, environment.TEST_MIGRATIONS)
})

// Storage is shared for the file, so every test starts from empty tables.
// Rate-limit counters cannot be reset; tests vary the client.
beforeEach(async () => {
  await environment.DB.batch([
    environment.DB.prepare('DELETE FROM withdrawal_requests'),
    environment.DB.prepare('DELETE FROM subscriptions'),
    environment.DB.prepare('DELETE FROM audit_log')
  ])
})
