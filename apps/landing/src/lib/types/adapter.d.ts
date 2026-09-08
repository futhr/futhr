declare module '*cloudflare/app.js' {
  const app: { fetch: (request: Request, env: Env, ctx: ExecutionContext) => Promise<Response> }
  export default app
}
