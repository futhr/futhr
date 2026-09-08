<script lang="ts">
  import { page } from '$app/state'
  import { strings } from '$lib/strings'
</script>

<svelte:head
  ><title>{page.status} — {page.data.project?.name ?? strings.notFound}</title>
  <meta name="robots" content="noindex, nofollow"></svelte:head
>
<main class="error-page">
  <div>
    <p>{page.data.project?.name}</p>
    <h1>{strings.emptyPage}</h1>
    <a href="/">{page.data.project?.host}</a>
  </div>
</main>
