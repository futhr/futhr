import type { Component } from 'svelte'
import type { BrandId } from '$lib/types/brand-id'
import Diggymon from '$site/components/logos/diggymon.svelte'
import Orvane from '$site/components/logos/orvane.svelte'
import Refpath from '$site/components/logos/refpath.svelte'
import Rivure from '$site/components/logos/rivure.svelte'

/** The reusable marks from the showcase are the single vector source. */
const marks: Readonly<Record<BrandId, Component>> = {
  rivure: Rivure,
  diggymon: Diggymon,
  refpath: Refpath,
  orvane: Orvane
}

export { marks }
