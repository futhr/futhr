<script lang="ts">
  import { type Snippet, tick } from 'svelte'
  import { registerShowcaseTools } from '$lib/client/model-context'
  import { createRowGlide } from '$lib/client/row-glide'
  import Entry from '$lib/components/entry.svelte'
  import MarkerFilter from '$lib/components/marker-filter.svelte'
  import { site } from '$lib/config/site'
  import type { ShowcaseEntry } from '$lib/types/showcase-entry'

  interface Props {
    items: ShowcaseEntry[]
    footer?: Snippet
  }

  let { items, footer }: Props = $props()
  let openSlug = $state<string | null>()
  let section = $state<HTMLElement>()
  const glide = createRowGlide()

  const initialOpenSlug = $derived(items[0]?.slug ?? null)
  const currentOpenSlug = $derived(openSlug === undefined ? initialOpenSlug : openSlug)
  const open = async (item: ShowcaseEntry) => {
    glide.stop()
    openSlug = item.slug
    await tick()
    if (section && currentOpenSlug === item.slug) {
      glide.to(section, items.indexOf(item))
    }
  }

  const toggle = (item: ShowcaseEntry) => {
    if (currentOpenSlug === item.slug) {
      glide.stop()
      openSlug = null
      return
    }
    return open(item)
  }

  $effect(() => glide.stop)

  $effect(() =>
    registerShowcaseTools({
      items,
      open: async (slug) => {
        const item = items.find((entry) => entry.slug === slug)
        if (item) {
          await open(item)
        }
      }
    })
  )
</script>

<section bind:this={section} aria-label={site.ui.selectedWork} class="relative min-h-dvh bg-paper">
  <MarkerFilter />

  {#each items as item, index (item.slug)}
    <Entry
      {item}
      {index}
      isOpen={currentOpenSlug === item.slug}
      divider={index === 0 || items[index - 1]?.group !== item.group}
      onToggle={() => toggle(item)}
    />
  {/each}
</section>

{@render footer?.()}
