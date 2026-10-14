import type { Brand } from '#lib/types/brand.ts'
import type { PageMeta } from '#lib/types/page-meta.ts'

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
  }
}
