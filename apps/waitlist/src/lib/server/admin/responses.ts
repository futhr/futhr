const status = {
  ok: 200,
  noContent: 204,
  badRequest: 400,
  unauthorized: 401,
  forbidden: 403,
  notFound: 404,
  methodNotAllowed: 405,
  serverError: 500
} as const

const headers = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'content-security-policy': "default-src 'none'; frame-ancestors 'none'",
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
  'x-robots-tag': 'noindex, nofollow'
}

const json = (code: number, body: unknown) =>
  new Response(code === status.noContent ? null : JSON.stringify(body), {
    status: code,
    headers
  })

const problem = (code: number, error: string) => json(code, { error })

/** JSON responses for the private API, always uncacheable and unindexed. */
const adminResponses = { status, json, problem } as const

export { adminResponses }
