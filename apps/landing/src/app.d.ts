import type { Project } from '$lib/types/project'

declare global {
  namespace App {
    interface Locals {
      project?: Project
    }
    interface Platform {
      env: Env
    }
  }
}
