import { projects } from './projects'
import type { Project } from './types/project'

type Resolution = { readonly project: Project; readonly redirect: boolean } | undefined

/** The URL parser supplies the hostname; no path, query or forwarded header selects a brand. */
const resolveHost = (hostname: string, local = false): Resolution => {
  for (const project of Object.values(projects)) {
    if (hostname === project.host || (local && hostname === `${project.id}.localhost`)) {
      return { project, redirect: false }
    }
    if (hostname === `www.${project.host}`) {
      return { project, redirect: true }
    }
  }
  return undefined
}

export { resolveHost }
