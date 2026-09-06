<script lang="ts">
  import type { Component } from 'svelte'
  import Page from '$lib/components/page.svelte'
  import type { Brand } from '$lib/types/brand'
  import type { PageNotice } from '$lib/types/page-notice'

  interface Props {
    brand: Brand
    mark: Component
    notice: PageNotice
  }

  let { brand, mark, notice }: Props = $props()
</script>

<Page {brand} {mark} lede={notice.heading}>
  <div class="flex flex-col items-center gap-6">
    <p class="m-0 max-w-[40ch] text-(length:--body-size) leading-[1.6] text-muted">{notice.text}</p>
    {#if notice.back}
      <a
        href="/"
        class="font-bold text-paper underline underline-offset-4 hover:text-signal focus-visible:text-signal"
        >{notice.back}</a
      >
    {/if}
  </div>
</Page>
