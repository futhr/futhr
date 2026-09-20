import type { Component } from 'svelte'
import type { BrandId } from '$lib/types/brand-id'
import Diggymon from '$site/components/marks/diggymon.svelte'
import Orvane from '$site/components/marks/orvane.svelte'
import Refpath from '$site/components/marks/refpath.svelte'
import Rivure from '$site/components/marks/rivure.svelte'

/** Reusable adapters for the standalone showcase marks. */
const marks: Readonly<Record<BrandId, Component>> = {
  rivure: Rivure,
  diggymon: Diggymon,
  refpath: Refpath,
  orvane: Orvane
}

export { marks }
