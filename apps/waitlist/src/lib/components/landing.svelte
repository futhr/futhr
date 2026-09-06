<script lang="ts">
  import type { Component } from 'svelte'
  import JoinForm from '$lib/components/join-form.svelte'
  import Page from '$lib/components/page.svelte'
  import type { Brand } from '$lib/types/brand'
  import type { JoinFormProps } from '$lib/types/join-form-props'

  interface Props {
    brand: Brand
    mark: Component
    joinForm: JoinFormProps
  }

  let { brand, mark, joinForm }: Props = $props()
</script>

<Page {brand} {mark} lede={brand.closing} skipTarget="join-form">
  <section id="join-form" class="flex w-full flex-col items-center border-t border-paper/15 pt-12">
    <JoinForm {...joinForm} />
  </section>
</Page>
