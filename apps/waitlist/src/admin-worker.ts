import { adminApp } from '#lib/server/admin/app.ts'
import type { AdminEnv } from '#lib/server/admin/env.ts'

export default {
  fetch: (request: Request, env: AdminEnv) => adminApp.fetch(request, env)
} satisfies ExportedHandler<AdminEnv>
