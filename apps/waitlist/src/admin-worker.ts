import { adminApp } from '$lib/server/admin/app'
import type { AdminEnv } from '$lib/server/admin/env'

export default {
  fetch: (request: Request, env: AdminEnv) => adminApp.fetch(request, env)
} satisfies ExportedHandler<AdminEnv>
