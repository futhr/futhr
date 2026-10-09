<script lang="ts">
  import Frameshift from '$lib/components/marks/frameshift.svelte'
  import Ghostshift from '$lib/components/marks/ghostshift.svelte'
  import Refpath from '$lib/components/marks/refpath.svelte'
  import Rivure from '$lib/components/marks/rivure.svelte'
  import Wotex from '$lib/components/marks/wotex.svelte'

  const marks = [
    { id: 'ghostshift', component: Ghostshift },
    { id: 'refpath', component: Refpath },
    { id: 'rivure', component: Rivure },
    { id: 'wotex', component: Wotex },
    { id: 'frameshift', component: Frameshift }
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
    justify-content: flex-end;
    gap: 2rem;
  }

  .mark {
    --mark-scale: 1;
    display: flex;
    flex: none;
    width: max-content;
    height: var(--mark-height);
    align-items: center;
  }

  .mark.ghostshift {
    --mark-scale: 0.82;
  }

  .mark.refpath {
    --mark-scale: 0.8;
  }

  .mark.rivure {
    --mark-scale: 0.835;
  }

  .mark.wotex {
    --mark-scale: 0.68;
  }

  .mark.frameshift {
    --mark-scale: 0.875;
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
