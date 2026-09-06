<script lang="ts">
  import type { Component } from 'svelte'
  import { privacyNotice } from '$lib/brands/privacy'
  import { strings } from '$lib/brands/strings'
  import Page from '$lib/components/page.svelte'
  import type { Brand } from '$lib/types/brand'

  interface Props {
    brand: Brand
    mark: Component
  }

  let { brand, mark }: Props = $props()

  const paragraphs = $derived(privacyNotice(brand))
</script>

<Page {brand} {mark} lede={strings.privacy.lede(brand)}>
  <article
    class="flex max-w-[46ch] flex-col gap-6 border-t border-paper/15 pt-12 text-(length:--body-size) leading-[1.6] text-muted"
  >
    {#each paragraphs as paragraph (paragraph)}
      <p class="m-0">{paragraph}</p>
    {/each}
  </article>
</Page>
