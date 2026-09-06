<script lang="ts">
  import archivoLatin from '@fontsource-variable/archivo/files/archivo-latin-wght-normal.woff2?url'
  import type { Snippet } from 'svelte'
  import { page } from '$app/state'
  import { brandDocuments } from '$lib/brands/documents'
  import { strings } from '$lib/brands/strings'
  import '$lib/styles/waitlist.css'

  let { children }: { children: Snippet } = $props()

  const documents = $derived(brandDocuments(page.data.brand))
  const meta = $derived(page.data.meta)
  const social = $derived(`${documents.origin}/icons/social.png`)
</script>

<svelte:head>
  <meta name="theme-color" content="#1b1b1b">
  <meta name="color-scheme" content="dark light">
  <link rel="preload" href={archivoLatin} as="font" type="font/woff2" crossorigin="anonymous">
  <link rel="icon" type="image/svg+xml" href="/icons/favicon.svg">
  <link rel="icon" type="image/png" sizes="48x48" href="/icons/favicon-48.png">
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="alternate" type="text/plain" href="/llms.txt" title="Machine-readable summary">
  {#if meta}
    <title>{meta.title}</title>
    <meta name="description" content={meta.description}>
    <meta name="keywords" content={page.data.brand.keywords.join(', ')}>
    <meta
      name="robots"
      content={meta.indexable ? 'index, follow, max-image-preview:large' : 'noindex, nofollow'}
    >
    <link rel="canonical" href={`${documents.origin}${meta.path}`}>
    <meta property="og:type" content="website">
    <meta property="og:site_name" content={page.data.brand.name}>
    <meta property="og:locale" content={strings.openGraphLocale}>
    <meta property="og:title" content={meta.title}>
    <meta property="og:description" content={meta.description}>
    <meta property="og:url" content={`${documents.origin}${meta.path}`}>
    <meta property="og:image" content={social}>
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content={`${page.data.brand.name} mark and waitlist`}>
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content={meta.title}>
    <meta name="twitter:description" content={meta.description}>
    <meta name="twitter:image" content={social}>
  {/if}
  {@html `<script type="application/ld+json">${documents.structuredData}</script>`}
</svelte:head>

{@render children()}
