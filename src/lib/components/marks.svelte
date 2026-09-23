<script lang="ts">
  import Agr from '$lib/components/marks/agr.svelte'
  import Bytly from '$lib/components/marks/bytly.svelte'
  import Diggymon from '$lib/components/marks/diggymon.svelte'
  import Orvane from '$lib/components/marks/orvane.svelte'
  import Recetas from '$lib/components/marks/recetas.svelte'
  import Refpath from '$lib/components/marks/refpath.svelte'
  import Reloved from '$lib/components/marks/reloved.svelte'
  import Rivure from '$lib/components/marks/rivure.svelte'
  import Wotex from '$lib/components/marks/wotex.svelte'

  const marks = [
    { id: 'refpath', component: Refpath },
    { id: 'bytly', component: Bytly },
    { id: 'diggymon', component: Diggymon },
    { id: 'orvane', component: Orvane },
    { id: 'reloved', component: Reloved },
    { id: 'rivure', component: Rivure },
    { id: 'agr', component: Agr },
    { id: 'recetas', component: Recetas },
    { id: 'wotex', component: Wotex }
  ] as const
</script>

<div class="marks">
  {#each marks as { id, component: Mark } (id)}
    <span class="mark {id}">
      <Mark />
    </span>
  {/each}
</div>

<style>
  .marks {
    --mark-height: clamp(1.125rem, 2.22cqw, 2rem);
    display: flex;
    width: 100%;
    min-width: 0;
    align-items: center;
    justify-content: space-between;
    gap: 0.35cqw;
  }

  .mark {
    --mark-scale: 1;
    display: flex;
    flex: none;
    width: max-content;
    height: var(--mark-height);
    align-items: center;
  }

  .mark.refpath,
  .mark.bytly {
    --mark-scale: 0.9;
  }

  .mark.diggymon {
    --mark-scale: 0.88;
  }

  .mark.orvane {
    --mark-scale: 1.1;
  }

  .mark.reloved {
    --mark-scale: 1.2;
  }

  .mark.rivure {
    --mark-scale: 0.98;
  }

  .mark.agr {
    --mark-scale: 1.18;
  }

  .mark.recetas {
    --mark-scale: 1.15;
  }

  .mark.wotex {
    --mark-scale: 1.22;
  }

  .mark > :global([role="img"]) {
    display: flex;
    width: max-content;
    height: 100%;
    align-items: center;
  }

  .mark :global(svg) {
    display: block;
    width: auto;
    height: calc(100% * var(--mark-scale));
  }
</style>
