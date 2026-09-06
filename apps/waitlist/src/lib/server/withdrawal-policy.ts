/** Application limits; the Cloudflare Free account plan provides the billing ceiling. */
const withdrawalPolicy = { maxPending: 1000, maxPageSize: 50 } as const

export { withdrawalPolicy }
