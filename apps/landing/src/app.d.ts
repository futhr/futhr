import type { Project } from '#lib/types/project.ts'

declare global {
  namespace App {
    interface Locals {
      project?: Project
    }
  }
}
