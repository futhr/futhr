---
name: frontend
description: Edit or review Svelte components, SvelteKit routes, component tests, and Storybook stories in this workspace. Use when changing reactivity, component APIs, rendered HTML, disclosure behaviour, SSR boundaries, or story composition. ExkPasswd's plain TypeScript browser shell follows its package guide.
user-invocable: false
---

# Frontend changes

## Inputs and output

Read the affected component or route, its callers, and the corresponding tests or
stories. Produce a focused change with verification of the affected behaviour;
report executed checks and visual measurements when applicable.

Resolve the application boundary before editing:

- The showcase is prerendered by the static adapter. Keep
  [src/routes/+layout.ts](../../../src/routes/+layout.ts) prerendered; page data
  arrives through `$props()` and the generated `PageData` type.
- The waitlist uses per-request Cloudflare SSR, hostname hooks, and form actions.
  Read [its operating guide](../../../apps/waitlist/README.md) for changes to
  routing or submissions; preserve the form's operation without JavaScript.
- The landing is stateless and has an outer Worker host gate. Read
  [its operating guide](../../../apps/landing/README.md) for routing or asset
  changes. Its adapter build configuration is not the production Worker config.
  Apply [worker-boundary](../worker-boundary/SKILL.md) for host/asset/auth/D1
  behavior; a component-only test cannot establish that boundary.
- Plain TypeScript password/PWA/extension work uses
  [password-browser](../password-browser/SKILL.md). It must not reimplement the
  canonical generator in a Svelte component.

## Reactivity and component contracts

- Use Svelte 5 runes: `$state` for local reactive state, `$derived` or
  `$derived.by` for computed values, and a typed `$props()` contract. Use
  `$bindable()` only when two-way binding is the clearest component API.
- Use `$effect` for external side effects, not computed state. Clean up resources
  allocated by an effect. Use `$effect.pre` when the previous layout must be
  measured before an update.
- A prop copied into a plain local variable captures its initial value. For a
  last-rendered tracker, follow the explicit initialisation and effect updates
  in [entry.svelte](../../../src/lib/components/entry.svelte).
- Avoid a prop named `state` in a component using `$state`; it conflicts with
  Svelte's store-subscription syntax.
- Use snippets and `{@render}` for composition, native event attributes such as
  `onclick`, and callback props for component events. Do not introduce legacy
  slots, `export let`, `on:click`, or `createEventDispatcher`.
- Key record lists by stable identity. Use class arrays for conditional utilities.
- Plain `<script>` exports are instance-scoped. Put shared values in a sibling
  module or `<script module>` when they must be imported.

## Rendering and accessibility

- Use native buttons and links for interaction. Keep disclosure controls' names,
  `aria-expanded`, and `aria-controls` in step with the panel's `aria-hidden` and
  `inert` state. Do not add widget roles to ordinary layout containers.
- Type `bind:this` for the actual tag; a `<section>` is an `HTMLElement`.
- Hide decorative SVGs from assistive technology. Give a meaningful project
  mark `role="img"` and a label ending in "mark".
- Use `{@html}` only for content sanitised by the
  [content loader](../../../src/lib/server/content.ts) or trusted, repository-owned
  output such as generated JSON-LD and standalone mark SVGs. Do not pass external
  or user-provided strings directly to it.
- Style with Tailwind utilities and shared tokens. Use component `<style>` only
  for a selector that cannot be expressed as a utility. The container-unit and
  motion constraints belong to `AGENTS.md`.
- Keep SSR enabled. Preserve each application's generated-document routes and
  their owning config instead of introducing client data fetching.

## Tests and Storybook

- Follow [the component tests](../../../tests/components/) for Chromium browser
  assertions: `render` from `vitest-browser-svelte`, queries on the rendered
  screen, and `await expect.element(...)`. Query accessible names; showcase
  disclosure names include their group label.
- Cover the changed interaction or state transition, including closed-panel
  focus exclusion and reduced motion when the change touches those mechanisms.
- Follow [the stories](../../../tests/stories/) using `defineMeta` from the
  Svelte CSF addon. `<Story>` children become the component's `children` prop;
  use `asChild` when the story must render wrapper markup around a component.
- Run the affected browser or story suite and package checks from `AGENTS.md`.
  Coverage floors live in the existing Vitest configs. Apply the visual
  verification requirements in `AGENTS.md` when changing layout. Select an
  independently observable acceptance/refusal or transition for each changed
  interaction; a rendered component or coverage hit is insufficient.
- For layout, record current artifact/source identity and compare the 1440px
  screenshot with the reference using cap-height offsets, starts, heights and
  line breaks. Also cover the affected container widths and reduced motion.
  A dev-server screenshot is not a production artifact/performance result.
- When build output, generated documents, icons or caching changes, inspect
  [artifact verification](../../../scripts/verify-artifact.ts) and the actual
  built files. Keep showcase, Storybook and imported password artifacts distinct;
  verify current service-worker network/cache behavior rather than a stale tab.
  Inspect package scripts before browser suites/builds, and report unavailable
  engines or build output without installing tools for a guidance-only change.
