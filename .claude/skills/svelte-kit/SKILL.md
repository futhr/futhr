---
name: svelte-kit
description: Svelte 5 and SvelteKit rules for this repository, including runes, snippets, event syntax, file naming, Tailwind v4 usage, and the parser and testing gotchas that produce silently broken components. Use when creating or editing any .svelte, .svelte.ts, or SvelteKit route file, or when reviewing component code.
---

# Svelte 5 and SvelteKit in this repository

Svelte 5 with runes, SvelteKit 2 with `@sveltejs/adapter-static`, Tailwind CSS v4
utilities, Biome, Vitest browser mode, Storybook. The showcase is prerendered, with no server runtime or client data fetching.
The separate waitlist package uses SvelteKit SSR on Cloudflare Workers, hostname
hooks, and form actions; see `apps/waitlist/README.md`. Neither uses a UI kit.

## Files and modules

- Component filenames are kebab-case: `marker-link.svelte`, `logos/refpath.svelte`.
  Import with a PascalCase default: `import MarkerLink from '$lib/components/marker-link.svelte'`.
- Internal imports use the `$lib` alias. There are no barrel `index.ts` files;
  `scripts/check-exports.ts` fails the build if a module exports more than one
  public symbol.
- Site strings, links, and metadata live in `src/lib/config/site.ts`. Components
  never hard-code copy.
- Styling is Tailwind utility classes on elements, with shared tokens and the few
  global rules in `src/lib/styles/site.css`. No per-component `<style>` blocks
  unless a selector cannot be expressed as a utility.

## Runes

- `let x = $state(value)` for local state; mutate directly. Never `useState`.
- `let y = $derived(expr)` or `$derived.by(() => ...)` for computed values.
  Never derive state inside `$effect`.
- `$effect` is for side effects only: DOM measurement, animations, timers,
  browser APIs. Return a cleanup function. `$effect.pre` runs before the DOM
  updates and is the place to measure the previous layout.
- `let { a, b = default }: Props = $props()` with a local `interface Props`.
  Never `export let`.
- `$bindable()` only where two-way binding is the clearest contract.
- Reading a prop into a plain `let` captures the initial value and svelte-check
  warns (`state_referenced_locally`). Initialise as `undefined` and assign inside
  an effect when you need a "last rendered" tracker.
- Do not name a prop `state` in a component that also uses `$state(...)`; the
  parser treats `$state` as a store subscription to the prop.

## Templates

- Snippets, never slots: `{#snippet name(arg)}...{/snippet}` and `{@render name(arg)}`.
  Children arrive as `children?: Snippet` and render with `{@render children?.()}`.
- Native event attributes: `onclick={handler}`. Never `on:click` or
  `createEventDispatcher`; pass callback props such as `onToggle`.
- Keyed `{#each items as item (item.slug)}` for lists of records.
- `class={[ 'always', condition && 'sometimes' ]}` for conditional classes.
- `{@html value}` only for content that passed `sanitize-html` in
  `src/lib/server/content.ts`.
- Exports from a plain `<script>` are instance-scoped. Shared constants belong in
  a sibling `.ts` file or a `<script module>` block.

## Accessibility

- Interactive surfaces are `<button>` or `<a>`. Never a `<div onclick>` padded
  with a no-op `onkeydown`.
- Disclosure rows carry `aria-expanded`, `aria-controls`, and the panel carries
  `aria-hidden` plus `inert` when closed.
- Decorative SVGs get `aria-hidden="true"`; meaningful marks get `role="img"` and
  an `aria-label` ending in "mark".
- `bind:this` types must match the tag: `<section>` is `HTMLElement`, not
  `HTMLDivElement`.
- Keep `role="grid"` and similar widget roles off layout containers; axe fails
  on missing required children.

## SvelteKit

- `export const prerender = true` stays in `src/routes/+layout.ts`. Do not add
  `ssr = false` anywhere.
- Page data arrives through `let { data }: { data: PageData } = $props()`.
- Generated files (`robots.txt`, `sitemap.xml`, `llms.txt`, `manifest.webmanifest`)
  are `+server.ts` routes that read `site.documents`.
- Anything that must work offline goes through `src/service-worker.ts`, which has
  its own `tsconfig.service-worker.json`.

## Tests and Storybook

- Every component under `src/lib/components/` must be rendered by at least one
  test in `tests/components/`; the coverage floor there is 95 percent statements
  and an unrendered file counts as zero.
- Component tests use `vitest-browser-svelte` in headless Chromium: `render`,
  `screen.getByRole`, `await expect.element(...)`. Accessible names of the
  disclosure buttons include the group label, for example `Venture Refpath`.
- Stories live in `tests/stories/*.stories.svelte` using `defineMeta` from the
  Svelte CSF addon. Children of `<Story>` are forwarded to the component as its
  `children` prop; to render wrapper markup around the component, set `asChild`
  on the Story, otherwise the wrapper silently disappears. `tests/storybook-e2e/storybook.test.ts` lists story ids that
  must exist; add new ids there.
- Playwright end-to-end tests run against the built artifact on desktop and
  mobile Chromium, including an axe scan.

## Tooling gotchas

- Biome: `noVoid` forbids `void expr` to create a dependency; read the value
  instead. Regex literals belong at module top level (`useTopLevelRegex`). Empty
  blocks are errors, so use `animation.onfinish` rather than `.catch(() => {})`.
- Biome formats with single quotes and no semicolons; run `pnpm format` rather
  than fixing by hand.
- macOS BSD `sed` ignores `\b`. Use the Edit tool for renames.
