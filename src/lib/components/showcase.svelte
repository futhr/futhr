<script lang="ts">
  import { type Snippet, tick } from 'svelte'
  import { foldMotion } from '$lib/client/fold-motion'
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
  let glideFrame = 0

  const initialOpenSlug = $derived(items[0]?.slug ?? null)
  const currentOpenSlug = $derived(openSlug === undefined ? initialOpenSlug : openSlug)
  const interruptEvents = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const

  const stopGlide = () => {
    cancelAnimationFrame(glideFrame)
    for (const type of interruptEvents) {
      globalThis.removeEventListener(type, stopGlide)
    }
  }

  // The height a row will have once it has settled. A closed row already has
  // it; the row that is closing right now is mid-animation, and its last
  // keyframe is the height it is heading for. Nothing here assumes the rows
  // match, so the tokens can change per container without touching this.
  const noKeyframe: Partial<ComputedKeyframe> = {}
  const settledHeight = (article: HTMLElement) => {
    const effect = article.getAnimations()[0]?.effect
    const keyframe = effect instanceof KeyframeEffect ? effect.getKeyframes().at(-1) : undefined
    const { height } = keyframe ?? noKeyframe
    return typeof height === 'string'
      ? Number.parseFloat(height)
      : article.getBoundingClientRect().height
  }

  // The rows animate their heights on one curve. Driving the scroll position on
  // the same curve towards the row's final position makes the clicked header
  // travel from where it was to the top of the viewport in one motion, with
  // every other row moving consistently around it. Nothing is measured per
  // frame, so nothing lags. Any user input hands control back at once.
  const glideTo = (row: HTMLElement, index: number) => {
    stopGlide()
    const section = row.parentElement?.parentElement
    if (!section) {
      return
    }
    const sectionTop = section.getBoundingClientRect().top + globalThis.scrollY
    const above = [...section.querySelectorAll<HTMLElement>('article')].slice(0, index)
    const target = Math.round(
      above.reduce((sum, article) => sum + settledHeight(article), sectionTop)
    )
    const from = globalThis.scrollY
    if (from === target) {
      return
    }
    if (globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      globalThis.scrollTo({ top: target, behavior: 'instant' })
      return
    }
    for (const type of interruptEvents) {
      globalThis.addEventListener(type, stopGlide, { passive: true })
    }
    const started = performance.now()
    const step = (now: number) => {
      const progress = Math.min(1, (now - started) / foldMotion.duration)
      globalThis.scrollTo({
        top: from + (target - from) * foldMotion.ease(progress),
        behavior: 'instant'
      })
      if (progress < 1) {
        glideFrame = requestAnimationFrame(step)
      } else {
        stopGlide()
      }
    }
    glideFrame = requestAnimationFrame(step)
  }

  const toggle = async (item: ShowcaseEntry) => {
    const opening = currentOpenSlug !== item.slug
    openSlug = opening ? item.slug : null
    if (!opening) {
      return
    }
    await tick()
    const row = document.getElementById(`showcase-row-${item.slug}`)
    if (row) {
      glideTo(row, items.indexOf(item))
    }
  }

  $effect(() => stopGlide)

  // WebMCP: expose the collection to browser agents where the API exists.
  $effect(() =>
    registerShowcaseTools({
      items,
      open: (slug) => {
        const item = items.find((entry) => entry.slug === slug)
        if (item) {
          toggle(item).catch(() => undefined)
        }
      }
    })
  )
</script>

<section aria-label={site.ui.selectedWork} class="relative min-h-dvh bg-paper">
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
