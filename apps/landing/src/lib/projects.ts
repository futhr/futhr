import type { Project } from './types/project'

const projects: Readonly<Record<Project['id'], Project>> = {
  wotex: {
    id: 'wotex',
    host: 'wotex.io',
    name: 'WoTEx',
    mark: 'wotex',
    indexed: true,
    statement: 'One standard for Things, and a runtime built to keep them running.',
    description: 'Open-source Web of Things libraries for Elixir and the BEAM.',
    link: {
      href: 'https://github.com/wotex-project',
      label: 'github.com/wotex-project',
      kind: 'Open source'
    }
  },
  ghostshift: {
    id: 'ghostshift',
    host: 'ghostshift.se',
    name: 'Ghostshift Assembly',
    mark: 'ghostshift',
    indexed: true,
    statement: 'Autonomous invention through compounding intelligence.',
    link: {
      href: 'https://github.com/ghostshift-assembly',
      label: 'github.com/ghostshift-assembly',
      kind: 'Organization'
    }
  }
}

export { projects }
