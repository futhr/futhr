import { SELF } from 'cloudflare:test'
import type { SubscriptionRow } from '../../../src/lib/server/subscription-row.ts'
import { environment } from '../environment.ts'

/** Calls the built Worker the way Cloudflare would, with the request's own hostname. */
const call = (url: string, init?: RequestInit) => SELF.fetch(url, init)

let clients = 0

/**
 * Posts the join form the way a browser does: form-encoded, same origin, asking
 * for HTML back (SvelteKit answers a JSON action result to anything that
 * prefers JSON), one client address per call.
 */
const join = (
  host: string,
  fields: Record<string, string>,
  options: { headers?: Record<string, string>; client?: string } = {}
) => {
  clients += 1
  const client = options.client ?? `10.0.${Math.floor(clients / 250)}.${clients % 250}`
  return call(`https://${host}/`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      accept: 'text/html',
      origin: `https://${host}`,
      'cf-connecting-ip': client,
      ...options.headers
    },
    body: new URLSearchParams(fields).toString()
  })
}

const rows = async () =>
  (
    await environment.DB.prepare(
      'SELECT * FROM subscriptions ORDER BY joined_at'
    ).all<SubscriptionRow>()
  ).results

const helpers = { call, join, rows } as const

export { helpers }
