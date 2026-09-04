<script lang="ts">
  import MarkerLink from '$lib/components/marker-link.svelte'
  import { site } from '$lib/config/site'
  import type { ShowcaseEntry } from '$lib/types/showcase-entry'

  interface Props {
    item: ShowcaseEntry
    index: number
    isOpen: boolean
    divider: boolean
    animated?: boolean
    onToggle: () => void
  }

  let { item, index, isOpen, divider, animated = true, onToggle }: Props = $props()

  const inverse = $derived(index % 2 === 0)
  let article = $state<HTMLElement>()
  let renderedOpen: boolean | undefined
  let previousHeight: number | undefined
  let animation: Animation | undefined

  // Measure the row before Svelte applies the new state, then animate the
  // height from the previous value to the new one so both the headline reveal
  // and the panel move together. Reduced-motion users get the final state.
  $effect.pre(() => {
    if (renderedOpen === undefined) {
      renderedOpen = isOpen
    } else if (isOpen !== renderedOpen) {
      previousHeight = article?.getBoundingClientRect().height
    }
  })

  $effect(() => {
    const element = article
    const from = previousHeight
    if (isOpen === renderedOpen || !element || from === undefined) {
      return
    }
    renderedOpen = isOpen
    animation?.cancel()
    const to = element.getBoundingClientRect().height
    if (
      !animated ||
      from === to ||
      globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    element.style.overflow = 'hidden'
    animation = element.animate([{ height: `${from}px` }, { height: `${to}px` }], {
      duration: 680,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
    })
    animation.onfinish = () => {
      element.style.overflow = ''
    }
  })
</script>

<div class="@container">
  <article
    bind:this={article}
    id={`showcase-row-${item.slug}`}
    data-state={isOpen ? 'open' : 'closed'}
    class={[
    'fold group/row relative h-(--fold-height) overflow-hidden data-[state=open]:h-auto data-[state=open]:overflow-visible',
    inverse ? 'bg-ink text-paper' : 'bg-paper text-ink'
  ]}
  >
    <button
      type="button"
      aria-expanded={isOpen}
      aria-controls={`showcase-panel-${item.slug}`}
      class="grid w-full cursor-pointer grid-cols-[var(--column)_minmax(0,1fr)] items-start border-0 bg-transparent p-0 text-left text-inherit @max-3xl:grid-cols-1"
      onclick={onToggle}
    >
      <span
        class="px-(--gutter) pt-[calc(var(--fold-inset)-0.15em)] text-(length:--label-size) leading-[1.1] font-extrabold tracking-[0.06em] uppercase"
        >{divider ? item.group : ''}</span
      >
      <span
        lang={site.language}
        class="min-w-0 pt-[calc(var(--fold-inset)-0.02em)] pr-(--gutter) text-(length:--headline-size) leading-[0.75] font-black tracking-[-0.04em] hyphens-manual [overflow-wrap:break-word] @max-3xl:px-5 @max-3xl:pt-1"
        >{item.title}</span
      >
    </button>

    <div
      id={`showcase-panel-${item.slug}`}
      aria-hidden={!isOpen}
      inert={!isOpen}
      class="grid grid-cols-[minmax(0,25.4cqw)_minmax(0,32.4cqw)] items-start pt-[6.7cqw] pr-(--gutter) pb-[7cqw] pl-(--column) opacity-0 transition-opacity duration-300 group-data-[state=open]/row:opacity-100 group-data-[state=open]/row:delay-150 motion-reduce:transition-none @max-3xl:block @max-3xl:px-5 @max-3xl:pt-8 @max-3xl:pb-12"
    >
      <p
        class="m-0 max-w-[17.5cqw] text-(length:--lede-size) leading-[1.35] font-medium tracking-[-0.015em] text-balance @max-3xl:max-w-none"
      >
        {item.lede}
      </p>
      <div class="flex flex-col gap-6 @max-3xl:mt-6">
        <div class="showcase-copy">{@html item.bodyHtml}</div>
        {#if item.links.length}
          <div class="flex flex-wrap gap-x-6 gap-y-2 text-(length:--body-size)">
            {#each item.links as link, linkIndex (link.href)}
              <MarkerLink href={link.href} label={link.label} seed={index * 7 + linkIndex * 13 + 1}>
                {link.label}
              </MarkerLink>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </article>
</div>
