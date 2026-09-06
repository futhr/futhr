<script lang="ts">
  import Bluesky from '$lib/components/logos/bluesky.svelte'
  import Futhr from '$lib/components/logos/futhr.svelte'
  import Github from '$lib/components/logos/github.svelte'
  import Mastodon from '$lib/components/logos/mastodon.svelte'
  import X from '$lib/components/logos/x.svelte'
  import Marks from '$lib/components/marks.svelte'
  import { site } from '$lib/config/site'
</script>

<footer class="@container min-h-90 bg-ink font-system text-paper">
  <div
    class="footer-grid grid min-w-0 grid-cols-[27.5fr_32.1fr_40.4fr] items-start gap-y-12 px-(--gutter) pt-6 pb-10 @max-5xl:grid-cols-[27.5fr_72.5fr] @max-3xl:grid-cols-1 @max-3xl:px-5 @max-3xl:pb-12"
  >
    <div class="flex flex-col @max-3xl:order-last">
      <div
        class="flex items-start gap-3 text-xl leading-5.5 font-bold whitespace-nowrap [&>svg]:-mt-1.25"
      >
        <Futhr />
        <span>{site.footer.brand}<span class="font-light">{site.footer.qualifier}</span></span>
      </div>

      <nav
        class="mt-9 flex items-center gap-3.5 [&_a]:grid [&_a]:size-6 [&_a]:place-items-center [&_a]:text-paper [&_a]:opacity-85 [&_a]:transition-[color,opacity] [&_a]:duration-200 [&_a:hover]:text-signal [&_a:hover]:opacity-100 [&_a:focus-visible]:text-signal [&_a:focus-visible]:opacity-100 [&_svg]:size-4.5 [&_svg]:fill-current"
        aria-label={site.ui.socialNavigation}
      >
        <a href={site.links.mastodon} rel="me" aria-label="Mastodon" title="Mastodon">
          <Mastodon />
        </a>
        <a href={site.links.bluesky} aria-label="Bluesky" title="Bluesky">
          <Bluesky />
        </a>
        <a href={site.links.x} aria-label="X" title="X">
          <X />
        </a>
        <a href={site.links.github} aria-label="GitHub" title="GitHub">
          <Github />
        </a>
      </nav>

      <p class="mt-4 mb-0 max-w-50 text-[13px] leading-[1.3] text-muted text-pretty">
        {site.description}<br>
        {site.footer.location}
        · {new Date().getFullYear()}
      </p>
    </div>

    <nav
      class="grid grid-cols-[32.4%_auto] justify-start @max-3xl:grid-cols-2 [&_h2]:mt-0 [&_h2]:mb-4.5 [&_h2]:text-xl [&_h2]:leading-5.5 [&_h2]:font-bold"
      aria-label={site.ui.footerNavigation}
    >
      <div>
        <h2>{site.ui.elsewhereHeading}</h2>
        <div
          class="flex flex-col items-start text-[13px] leading-[1.5] font-bold [&>a]:py-1 [&>span]:py-1 [&_a]:text-paper [&_a]:no-underline [&_a:hover]:text-signal [&_a:focus-visible]:text-signal"
        >
          {#each site.footer.elsewhere as item (item.label)}
            {#if item.href}
              <a href={item.href}>{item.label}</a>
            {:else}
              <span>{item.label}</span>
            {/if}
          {/each}
        </div>
      </div>
      <div>
        <h2>{site.ui.agentsHeading}</h2>
        <div
          class="flex flex-col items-start text-[13px] leading-[1.5] font-bold [&>a]:py-1 [&>span]:py-1 [&_a]:text-paper [&_a]:no-underline [&_a:hover]:text-signal [&_a:focus-visible]:text-signal"
        >
          {#each site.footer.agents as item (item.label)}
            <a href={item.href}>{item.label}</a>
          {/each}
        </div>
      </div>
    </nav>

    <Marks />
  </div>
</footer>
