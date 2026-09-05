---
order: 8
group: Elixir & OTP
title: Phoenix Assets
lede: A first-class SvelteKit frontend inside Phoenix, supervised and typed as one application.
repositories:
  - futhr/phoenix-assets
links:
  - label: Repository
    href: https://github.com/futhr/phoenix-assets
  - label: HexDocs
    href: https://hexdocs.pm/phoenix_assets
---

A frontend integration layer for Phoenix teams that need SvelteKit, Vite, and Storybook without creating a second operational product. Development tools run under supervision, backend routes and domain definitions generate TypeScript contracts, and production assets enter the release through validated manifests and integrity data. **Phoenix Assets** is unapologetically opinionated: it commits to one stack and wires it end to end rather than half-supporting every framework.

It began as the shared internal library beneath every product in this portfolio and stays generic on purpose; it knows Phoenix, Vite, Svelte, Tailwind, and Ash, and nothing about any product built on them. The Svelte stack is the default preset, but the same preset and plugin engine lets a host compose a different stack, or add an integration the stack does not ship, without forking the library. Phoenix remains the owner of lifecycle and deployment.

*Two languages, one application, one supervisor.*
