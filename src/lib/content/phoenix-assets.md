---
order: 9
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

Phoenix teams often end up operating the frontend as a second application. Phoenix Assets brings SvelteKit, Vite, and Storybook into a **supervised Phoenix release**. Backend routes and domain definitions generate TypeScript contracts, while validated manifests and integrity data carry production assets.

The library makes its stack choices explicit but lets the host compose presets and plugins without forking it. Phoenix still owns lifecycle and deployment.

*Two languages, one application, one supervisor.*
