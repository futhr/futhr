<script lang="ts">
  import Ager from '$lib/components/logos/ager.svelte'
  import Bytly from '$lib/components/logos/bytly.svelte'
  import Diggymon from '$lib/components/logos/diggymon.svelte'
  import Orvane from '$lib/components/logos/orvane.svelte'
  import Recetas from '$lib/components/logos/recetas.svelte'
  import Refpath from '$lib/components/logos/refpath.svelte'
  import Reloved from '$lib/components/logos/reloved.svelte'
  import Rivure from '$lib/components/logos/rivure.svelte'
</script>

<div
  class="grid w-full min-w-0 grid-cols-8 items-start gap-x-[5.5%] text-paper [&>svg]:block [&>svg]:h-auto [&>svg]:w-full @max-5xl:order-first @max-5xl:col-span-full @max-3xl:col-auto"
>
  <Refpath />
  <Bytly />
  <Diggymon />
  <Orvane />
  <Reloved />
  <Rivure />
  <Ager />
  <Recetas />
</div>
