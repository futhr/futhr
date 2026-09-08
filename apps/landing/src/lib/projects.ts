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
  reloved: {
    id: 'reloved',
    host: 'reloved.eco',
    name: 'Reloved',
    mark: 'reloved',
    indexed: true,
    statement: 'Owned locally. Found together.',
    description: 'Exploring household-owned resale networks.',
    link: {
      href: 'https://github.com/reloved-eco',
      label: 'github.com/reloved-eco',
      kind: 'Organization'
    },
    relationship: {
      from: { label: 'Local ownership', value: 'Household storefronts' },
      to: { label: 'Shared reach', value: 'Network discovery' }
    }
  },
  recetas: {
    id: 'recetas',
    host: 'recetas.co.com',
    name: 'Recetas',
    mark: 'recetas',
    indexed: false
  }
}

export { projects }
