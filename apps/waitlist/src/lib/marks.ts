import type { Component } from 'svelte'
import type { BrandId } from '$lib/types/brand-id'
import Diggymon from '$site/components/marks/diggymon.svelte'
import Orvane from '$site/components/marks/orvane.svelte'
import Recetas from '$site/components/marks/recetas.svelte'
import Refpath from '$site/components/marks/refpath.svelte'
import Reloved from '$site/components/marks/reloved.svelte'
import Rivure from '$site/components/marks/rivure.svelte'

/** Reusable adapters for the standalone showcase marks. */
const marks: Readonly<Record<BrandId, Component>> = {
  rivure: Rivure,
  diggymon: Diggymon,
  refpath: Refpath,
  orvane: Orvane,
  reloved: Reloved,
  recetas: Recetas
}

export { marks }
