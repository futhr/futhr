<script lang="ts">
  import { page } from '$app/state'
  import { strings } from '$lib/brands/strings'
  import Notice from '$lib/components/notice.svelte'
  import { marks } from '$lib/marks'

  const notFound = 404
  const brand = $derived(page.data.brand)
  const missing = $derived(page.status === notFound)
  const notice = $derived(
    missing
      ? {
          heading: strings.notFound.heading,
          text: strings.notFound.text(brand),
          back: strings.notFound.back
        }
      : { heading: strings.error.heading, text: strings.error.text, back: strings.notFound.back }
  )
</script>

<svelte:head>
  <title>{missing ? strings.notFound.title(brand) : strings.error.title(brand)}</title>
  <meta name="robots" content="noindex, nofollow">
</svelte:head>

<Notice {brand} mark={marks[brand.id]} {notice} />
