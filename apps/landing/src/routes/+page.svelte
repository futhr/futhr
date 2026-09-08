<script lang="ts">
  import ProjectLanding from '$lib/components/project-landing.svelte'

  let { data } = $props()
</script>

<svelte:head>
  {#if data.project}
    <title>{data.project.name}</title>
    {#if data.project.description}
      <meta name="description" content={data.project.description}>
    {/if}
    <meta name="robots" content={data.project.indexed ? 'index, follow' : 'noindex, nofollow'}>
    <link rel="canonical" href={`https://${data.project.host}/`}>
    <meta property="og:type" content="website">
    <meta property="og:title" content={data.project.name}>
    <meta property="og:url" content={`https://${data.project.host}/`}>
    <meta property="og:image" content={`https://${data.project.host}/social.png`}>
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content={`${data.project.name} project identity`}>
    {#if data.project.description}
      <meta property="og:description" content={data.project.description}>
    {/if}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="theme-color" content="#1b1b1b">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="icon" href="/favicon-48.png" type="image/png" sizes="48x48">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">
    <link rel="manifest" href="/manifest.webmanifest">
  {/if}
</svelte:head>
{#if data.project}
  <ProjectLanding project={data.project} />
{/if}
