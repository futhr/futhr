<script lang="ts">
  import { controller } from '$lib/brands/controller'
  import { strings } from '$lib/brands/strings'
  import EmailForm from '$lib/components/email-form.svelte'
  import Page from '$lib/components/page.svelte'
  import { marks } from '$lib/marks'
  import type { ActionData, PageData } from './$types'

  let { data, form }: { data: PageData; form: ActionData } = $props()
</script>

<Page
  brand={data.brand}
  mark={marks[data.brand.id]}
  lede={strings.withdraw.lede}
  skipTarget="withdraw-form-heading"
>
  <EmailForm
    id="withdraw-form"
    text={data.text}
    result={{ complete: form?.requested, error: form?.error }}
  />
  <p class="m-0 max-w-[36ch] text-sm leading-[1.6] text-muted">
    {strings.withdraw.alternative}
    <a href={`mailto:${controller.contact}`} class="text-paper underline underline-offset-4"
      >{controller.contact}</a
    >.
  </p>
</Page>
