const destination = 'https://futhr.io'

const redirect = (request: Request): Response => {
  const source = new URL(request.url)
  const target = new URL(destination)
  target.pathname = source.pathname
  target.search = source.search

  return new Response(null, {
    status: 301,
    headers: { location: target.toString() }
  })
}

// biome-ignore lint/style/noDefaultExport: Cloudflare module Workers require a default export.
export default { fetch: redirect }
