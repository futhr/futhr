import type { Component } from 'svelte'
import type { Project } from '$lib/types/project'
import Recetas from '$site/components/marks/recetas.svelte'
import Reloved from '$site/components/marks/reloved.svelte'
import Wotex from '$site/components/marks/wotex.svelte'

const marks: Readonly<Record<Project['id'], Component>> = {
  wotex: Wotex,
  reloved: Reloved,
  recetas: Recetas
}

export { marks }
