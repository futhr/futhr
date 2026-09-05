# Development guide

[![CI](https://github.com/futhr/futhr/actions/workflows/ci.yml/badge.svg)](https://github.com/futhr/futhr/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/futhr/futhr/branch/main/graph/badge.svg)](https://codecov.io/gh/futhr/futhr)
[![Storybook](https://img.shields.io/badge/storybook-ui.futhr.io-1b1b1b?logo=storybook&logoColor=dcdbd6)](https://ui.futhr.io/)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Ffuthr.io&label=futhr.io&color=1b1b1b)](https://futhr.io/)
[![Checked with Biome](https://img.shields.io/badge/checked_with-Biome-60a5fa?logo=biome&logoColor=white)](https://biomejs.dev/)
[![Svelte 5](https://img.shields.io/badge/svelte-5-ff3e00?logo=svelte&logoColor=white)](https://svelte.dev/)
[![Node 24](https://img.shields.io/badge/node-%3E%3D24-5fa04e?logo=node.js&logoColor=white)](../.nvmrc)
[![pnpm](https://img.shields.io/badge/pnpm-11-f69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Code license: MIT](https://img.shields.io/badge/code-MIT-1b1b1b.svg)](../LICENSE.md)

Source for [futhr.io](https://futhr.io/): SvelteKit 2, Svelte 5, Tailwind CSS 4,
TypeScript, prerendered and deployed to Cloudflare. The root `README.md` is the
GitHub profile page; this file is where development starts. Application code is
MIT; editorial copy and marks are excluded, see [LICENSE.md](../LICENSE.md).

## Quick start

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium   # once, for browser tests
pnpm dev                                # http://127.0.0.1:5173
pnpm storybook                          # http://127.0.0.1:6006
```

Node 24 (`.nvmrc`) and pnpm 11.24.0 (`packageManager` in `package.json`).

## Commands

| Command | Does |
| --- | --- |
| `pnpm quality` | Biome lint and format check, one-export-per-module rule |
| `pnpm check` | svelte-check and the service-worker TypeScript project |
| `pnpm test:unit` | Content loader, agent documents, palette, site config; coverage gated |
| `pnpm test:components` | Components in headless Chromium; coverage gated |
| `pnpm test:storybook` | Story rendering, interactions, axe |
| `pnpm test:e2e` | Builds, then Playwright on desktop and mobile Chromium |
| `pnpm test:storybook:e2e` | Builds Storybook, then tests the static artifact |
| `pnpm test:all` | Everything above in CI order |
| `pnpm build` | Prerenders to `build/` and verifies the artifact |
| `pnpm preview` | Serves `build/` for audits; restart after each rebuild |
| `pnpm storybook:build` | Static Storybook to `storybook-static/` |
| `pnpm storybook:deploy` | Builds and deploys Storybook with Wrangler |

CI runs the same sequence on pull requests and pushes to `main`, uploads coverage
to Codecov, and dry-runs the Storybook deployment.

## Layout

| Path | Contents |
| --- | --- |
| `src/lib/components/` | Production components; `logos/` holds the SVG marks |
| `src/lib/client/` | Browser-only integrations such as the WebMCP tools |
| `src/lib/config/` | `site.ts` identity and strings, `palette.ts` weekly colours |
| `src/lib/content/` | Ordered Markdown entries |
| `src/lib/server/` | Content loader, validation, agent document generators |
| `src/lib/styles/site.css` | Tailwind theme, layout tokens, global rules |
| `src/routes/` | The page plus generated `llms.txt`, `llms-full.txt`, `agents.md`, `agents/stack.md`, `work/<slug>.md`, manifest, robots, sitemap |
| `tests/` | `components/` Vitest browser, `stories/` Storybook, `e2e/` and `storybook-e2e/` Playwright, unit tests at the top level |
| `static/` | Icons, `_headers`, font licence |
| `.claude/` | Agent skills and settings; [AGENTS.md](../AGENTS.md) is the canonical contract |

Conventions: kebab-case filenames, `$lib` imports, no barrel files, at most one
public symbol per module. Entries are Markdown with `order`, `group`, `title`,
`lede`, `repositories`, and `links` in frontmatter; the build rejects gaps,
duplicates, missing fields, unsafe link protocols, and non-kebab filenames.

## Documents

| Document | Purpose |
| --- | --- |
| [architecture/showcase.md](architecture/showcase.md) | How the site works: composition, motion, content pipeline, colour, offline, icons, agent surface, verification |
| [architecture/cloudflare.md](architecture/cloudflare.md) | Deployment: Workers static assets, headers and CSP, custom domains and TLS, CI deploys, token scoping, migration from Pages |
| [architecture/waitlist-platform.md](architecture/waitlist-platform.md) | Proposal for a multi-brand waitlist platform; not implemented |
| [legal/accessibility.md](legal/accessibility.md) | Accessibility statement |
| [legal/privacy.md](legal/privacy.md) | Privacy information for a static site with no processors |
| [security/supply-chain.md](security/supply-chain.md) | Supply-chain policy and verification gates |

Repository policies are indexed in [POLICIES.md](../POLICIES.md). Agent guidance is
[AGENTS.md](../AGENTS.md) with the skills under `.claude/skills/`; the deployed
site serves the same guidance at `/agents.md` and `/agents/stack.md`.
