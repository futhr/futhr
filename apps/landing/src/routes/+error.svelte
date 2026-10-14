<script lang="ts">
  import { strings } from '#lib/strings.ts'
  import { page } from '$app/state'
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
