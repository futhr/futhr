import { expect, it } from 'vitest'
import { withdrawalPolicy } from '../../../src/lib/server/withdrawal-policy.ts'
import { environment } from '../environment.ts'
import { helpers } from './helpers.ts'

let clients = 0
const withdraw = (
  email: string,
  options: { origin?: string; client?: string; website?: string } = {}
) => {
  clients += 1
  return helpers.call('https://rivure.com/withdraw', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      accept: 'text/html',
      origin: options.origin ?? 'https://rivure.com',
      'cf-connecting-ip': options.client ?? `192.0.2.${clients}`
    },
    body: new URLSearchParams({ email, website: options.website ?? '' }).toString()
  })
}
const requests = async () =>
  (await environment.DB.prepare('SELECT * FROM withdrawal_requests').all()).results

it('queues one request for the original subscription without deleting or exposing membership', async () => {
  await helpers.join('rivure.com', { email: 'Owner@example.com' })
  await helpers.join('diggymon.com', { email: 'Owner@example.com' })
  const original = (await helpers.rows()).find((row) => row.brand_id === 'rivure')
  const response = await withdraw('owner@example.com')
  expect(response.status).toBe(200)
  expect(await response.text()).toContain('If this address is on the list')
  const [request] = await requests()
  expect(request).toMatchObject({
    brand_id: 'rivure',
    subscription_id: original?.id,
    status: 'pending'
  })
  expect(Object.keys(request ?? {})).not.toContain('email')
  expect((await withdraw('Owner@example.com')).status).toBe(200)
  expect(await requests()).toEqual([request])
  const unknown = await withdraw('missing@example.com')
  expect(unknown.status).toBe(200)
  expect(await unknown.text()).toContain('If this address is on the list')
  expect(await requests()).toHaveLength(1)
  expect(await helpers.rows()).toHaveLength(2)
})

it('rejects foreign origins and invalid input and silently discards the honeypot', async () => {
  await helpers.join('rivure.com', { email: 'owner@example.com' })
  expect((await withdraw('owner@example.com', { origin: 'https://evil.example' })).status).toBe(403)
  expect((await withdraw('not-an-address')).status).toBe(400)
  expect((await withdraw('owner@example.com', { website: 'filled' })).status).toBe(200)
  expect((await withdraw('x'.repeat(9000))).status).toBe(413)
  expect(await requests()).toHaveLength(0)
})

it('rate limits repeated requests without changing their receipt time', async () => {
  await helpers.join('rivure.com', { email: 'rate@example.com' })
  const statuses: number[] = []
  for (let attempt = 0; attempt < 6; attempt += 1) {
    statuses.push((await withdraw('rate@example.com', { client: '198.51.100.44' })).status)
  }
  expect(statuses).toEqual([200, 200, 200, 200, 200, 429])
  expect(await requests()).toHaveLength(1)
})

it('fails explicitly for every address when the brand inbox is full', async () => {
  await helpers.join('rivure.com', { email: 'owner@example.com' })
  await environment.DB.prepare(`WITH RECURSIVE numbers(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM numbers WHERE n < ?1)
    INSERT INTO withdrawal_requests (id, brand_id, subscription_id, requested_at)
    SELECT 'request-' || n, 'rivure', 'subscription-' || n, '2026-09-06T00:00:00.000Z' FROM numbers`)
    .bind(withdrawalPolicy.maxPending)
    .run()
  for (const email of ['owner@example.com', 'unknown@example.com']) {
    const response = await withdraw(email)
    expect(response.status).toBe(503)
    expect(await response.text()).toContain('The request could not be recorded')
    expect(await requests()).toHaveLength(withdrawalPolicy.maxPending)
  }
  expect(await helpers.rows()).toHaveLength(1)
})
