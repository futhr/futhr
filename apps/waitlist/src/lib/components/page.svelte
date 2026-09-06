<script lang="ts">
  import type { Component, Snippet } from 'svelte'
  import { strings } from '$lib/brands/strings'
  import type { Brand } from '$lib/types/brand'

  interface Props {
    brand: Brand
    mark: Component
    /** The one line under the brand name. */
    lede: string
    skipTarget?: string
    children: Snippet
  }

  let { brand, mark: Mark, lede, skipTarget, children }: Props = $props()

  const year = new Date().getFullYear()
</script>

<!-- One centred column on ink: the mark, the label, the name, one line, and
     whatever the page adds below. The footer carries the legal link only. -->
<div class="@container flex min-h-dvh flex-col bg-ink text-paper">
  {#if skipTarget}
    <a
      class="fixed top-4 left-4 z-999 translate-y-[-180%] bg-paper px-3.5 py-2.5 text-[0.8rem] font-extrabold text-ink no-underline transition-transform duration-150 focus:translate-y-0 motion-reduce:transition-none"
      href={`#${skipTarget}`}
      >{strings.skipToForm}</a
    >
  {/if}

  <main
    id="main"
    class="mx-auto flex w-full max-w-2xl grow flex-col items-center justify-center gap-14 px-5 py-16 text-center"
  >
    <header class="flex flex-col items-center gap-7">
      <span class="block w-16 [&>svg]:block [&>svg]:h-auto [&>svg]:w-full">
        <Mark />
      </span>
      <span
        class="pl-[0.35em] text-(length:--label-size) leading-none font-extrabold tracking-[0.35em] text-muted uppercase"
        >{strings.label}</span
      >
      <h1
        lang={strings.language}
        class="m-0 text-[clamp(3.25rem,7cqw,6.5rem)] leading-[0.9] font-black tracking-[-0.03em] wrap-break-word"
      >
        {brand.name}
      </h1>
      <p
        class="m-0 max-w-[32ch] text-[clamp(1.125rem,1.45cqw,1.5rem)] leading-[1.4] font-medium text-balance"
      >
        {lede}
      </p>
    </header>

    {@render children()}
  </main>

  <footer
    class="flex items-center justify-center gap-6 px-5 pb-8 font-system text-[13px] leading-normal text-muted"
  >
    <a
      href="/privacy"
      class="font-bold text-paper/80 no-underline hover:text-signal focus-visible:text-signal"
      >{strings.footer.privacy}</a
    >
    <span>{brand.name} · {year}</span>
  </footer>
</div>
