import type { PublicEnv } from '$lib/server/public-env'
import type { Brand } from '$lib/types/brand'
import type { PageMeta } from '$lib/types/page-meta'

declare global {
  namespace App {
    interface Locals {
      /** Resolved from the hostname in src/hooks.server.ts before any route runs. */
      brand: Brand
    }
    interface PageData {
      brand: Brand
      meta?: PageMeta
    }
    interface Platform {
      env: PublicEnv
    }
  }
}
