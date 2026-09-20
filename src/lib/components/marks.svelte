<script lang="ts">
  import ager from '$lib/marks/ager.svg?url'
  import bytly from '$lib/marks/bytly.svg?url'
  import diggymon from '$lib/marks/diggymon.svg?url'
  import orvane from '$lib/marks/orvane.svg?url'
  import recetas from '$lib/marks/recetas.svg?url'
  import refpath from '$lib/marks/refpath.svg?url'
  import reloved from '$lib/marks/reloved.svg?url'
  import rivure from '$lib/marks/rivure.svg?url'
  import wotex from '$lib/marks/wotex.svg?url'

  const marks = [
    { id: 'refpath', name: 'Refpath', src: refpath },
    { id: 'bytly', name: 'Bytly', src: bytly },
    { id: 'diggymon', name: 'Diggymon', src: diggymon },
    { id: 'orvane', name: 'Orvane', src: orvane },
    { id: 'reloved', name: 'Reloved', src: reloved },
    { id: 'rivure', name: 'Rivure', src: rivure },
    { id: 'ager', name: 'ÄGR', src: ager },
    { id: 'recetas', name: 'Recetas', src: recetas },
    { id: 'wotex', name: 'WoTEx', src: wotex }
  ] as const
</script>

<div class="marks">
  {#each marks as { id, name, src } (id)}
    <span class="mark {id}">
      <img {src} alt={`${name} mark`}>
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

  .mark.ager {
    --mark-scale: 1.18;
  }

  .mark.recetas {
    --mark-scale: 1.15;
  }

  .mark.wotex {
    --mark-scale: 1.22;
  }

  .mark :global(img) {
    display: block;
    width: auto;
    height: calc(100% * var(--mark-scale));
  }
</style>
