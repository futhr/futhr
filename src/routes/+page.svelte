<script lang="ts">
  import Footer from '$lib/components/footer.svelte'
  import Showcase from '$lib/components/showcase.svelte'
  import { site } from '$lib/config/site'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
</script>

<svelte:head>
  <title>{site.seo.title}</title>
  <meta name="description" content={site.seo.description}>
  <meta name="author" content={site.author.name}>
  <meta name="keywords" content={site.seo.keywords.join(', ')}>
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href={site.canonicalUrl}>
  <link rel="alternate" type="text/plain" href="/llms.txt" title="Machine-readable summary">
  <link rel="alternate" type="text/markdown" href="/llms-full.txt" title="Portfolio as Markdown">

  <meta property="og:type" content="website">
  <meta property="og:site_name" content={site.displayName}>
  <meta property="og:locale" content={site.openGraphLocale}>
  <meta property="og:title" content={site.seo.socialTitle}>
  <meta property="og:description" content={site.description}>
  <meta property="og:url" content={site.canonicalUrl}>
  <meta property="og:image" content={site.images.social}>
  <meta property="og:image:alt" content={site.displayName}>

  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content={site.seo.socialTitle}>
  <meta name="twitter:description" content={site.description}>
  <meta name="twitter:image" content={site.images.social}>
  {@html `<script type="application/ld+json">${site.documents.structuredData}</script>`}
</svelte:head>

<a
  class="fixed top-4 left-4 z-999 -translate-y-[180%] bg-ink px-3.5 py-2.5 text-[0.8rem] font-extrabold text-paper no-underline transition-transform duration-150 focus:translate-y-0 motion-reduce:transition-none"
  href="#work"
  >{site.ui.skipToWork}</a
>

<main id="work">
  <h1 class="sr-only">{site.ui.workHeading}</h1>
  <Showcase items={data.items}>
    {#snippet footer()}
      <Footer />
    {/snippet}
  </Showcase>
</main>
