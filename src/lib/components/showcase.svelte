<script lang="ts">
  import { type Snippet, tick } from 'svelte'
  import { registerShowcaseTools } from '$lib/client/model-context'
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
  let instantSlug = $state<string | null>(null)
  let settleTimer = 0

  const initialOpenSlug = $derived(items[0]?.slug ?? null)
  const currentOpenSlug = $derived(openSlug === undefined ? initialOpenSlug : openSlug)
  const interruptEvents = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const

  const stopTracking = () => {
    clearTimeout(settleTimer)
    for (const type of interruptEvents) {
      globalThis.removeEventListener(type, stopTracking)
    }
  }

  const pageTop = (row: HTMLElement) => row.getBoundingClientRect().top + globalThis.scrollY

  // Expand, position, release. A row that closes above the clicked one
  // collapses instantly and the scroll position is corrected by the same
  // height in the same frame, so the clicked row never moves while it expands.
  // Once the expansion has finished, the row scrolls to the top with the
  // browser's own smooth scroll and control returns to the reader. Any input
  // during the expansion releases immediately.
  const settle = (slug: string) => {
    stopTracking()
    const row = document.getElementById(`showcase-row-${slug}`)
    if (!row) {
      return
    }
    if (globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      globalThis.scrollTo({ top: pageTop(row), behavior: 'instant' })
      return
    }
    for (const type of interruptEvents) {
      globalThis.addEventListener(type, stopTracking, { passive: true })
    }
    settleTimer = setTimeout(() => {
      stopTracking()
      globalThis.scrollTo({ top: pageTop(row), behavior: 'smooth' })
    }, 680)
  }

  const toggle = async (item: ShowcaseEntry) => {
    const opening = currentOpenSlug !== item.slug
    const previousSlug = currentOpenSlug
    const previousRow = previousSlug
      ? document.getElementById(`showcase-row-${previousSlug}`)
      : null
    const previousHeight = previousRow?.getBoundingClientRect().height ?? 0
    const collapseAbove =
      opening &&
      previousRow !== null &&
      items.findIndex((entry) => entry.slug === previousSlug) < items.indexOf(item)

    instantSlug = collapseAbove ? previousSlug : null
    openSlug = opening ? item.slug : null
    if (!opening) {
      return
    }

    await tick()
    if (collapseAbove && previousRow) {
      globalThis.scrollBy({
        top: previousRow.getBoundingClientRect().height - previousHeight,
        behavior: 'instant'
      })
    }
    settle(item.slug)
  }

  $effect(() => stopTracking)

  // WebMCP: expose the collection to browser agents where the API exists.
  $effect(() =>
    registerShowcaseTools({
      items,
      open: (slug) => {
        const item = items.find((entry) => entry.slug === slug)
        if (item && currentOpenSlug !== slug) {
          toggle(item).catch(() => undefined)
        }
      }
    })
  )
</script>

<section
  aria-label={site.ui.selectedWork}
  class="relative min-h-dvh bg-paper [overflow-anchor:none]"
>
  <MarkerFilter />

  {#each items as item, index (item.slug)}
    <Entry
      {item}
      {index}
      isOpen={currentOpenSlug === item.slug}
      divider={index === 0 || items[index - 1]?.group !== item.group}
      animated={item.slug !== instantSlug}
      onToggle={() => toggle(item)}
    />
  {/each}
</section>

{@render footer?.()}
