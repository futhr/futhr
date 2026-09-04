<script lang="ts">
  import archivoLatinItalic from '@fontsource-variable/archivo/files/archivo-latin-wght-italic.woff2?url'
  import archivoLatin from '@fontsource-variable/archivo/files/archivo-latin-wght-normal.woff2?url'
  import type { Snippet } from 'svelte'
  import { site } from '$lib/config/site'
  import '$lib/styles/site.css'

  let { children }: { children: Snippet } = $props()
</script>

<svelte:head>
  <meta name="theme-color" content="#1b1b1b">
  <meta name="color-scheme" content="dark light">
  <link rel="preload" href={archivoLatin} as="font" type="font/woff2" crossorigin="anonymous">
  <link rel="preload" href={archivoLatinItalic} as="font" type="font/woff2" crossorigin="anonymous">
  <link rel="icon" type="image/svg+xml" href={site.images.favicon}>
  <link rel="apple-touch-icon" href={site.images.touchIcon}>
  <link rel="manifest" href="/manifest.webmanifest">
</svelte:head>

{@render children()}
