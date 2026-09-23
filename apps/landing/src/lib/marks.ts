import type { Component } from 'svelte'
import type { Project } from '$lib/types/project'
import Wotex from '$site/components/marks/wotex.svelte'

const marks: Readonly<Record<Project['id'], Component>> = {
  wotex: Wotex
}

export { marks }
