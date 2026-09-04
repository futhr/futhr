# futhr

[![CI](https://github.com/futhr/futhr/actions/workflows/ci.yml/badge.svg)](https://github.com/futhr/futhr/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/futhr/futhr/branch/main/graph/badge.svg)](https://codecov.io/gh/futhr/futhr)
[![Storybook](https://img.shields.io/badge/storybook-ui.futhr.io-1b1b1b?logo=storybook&logoColor=dcdbd6)](https://ui.futhr.io/)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Ffuthr.io&label=futhr.io&color=1b1b1b)](https://futhr.io/)
[![Checked with Biome](https://img.shields.io/badge/checked_with-Biome-60a5fa?logo=biome&logoColor=white)](https://biomejs.dev/)
[![Svelte 5](https://img.shields.io/badge/svelte-5-ff3e00?logo=svelte&logoColor=white)](https://svelte.dev/)
[![Node 24](https://img.shields.io/badge/node-%3E%3D24-5fa04e?logo=node.js&logoColor=white)](.nvmrc)
[![pnpm](https://img.shields.io/badge/pnpm-11-f69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Dependabot](https://img.shields.io/badge/dependabot-enabled-025e8c?logo=dependabot&logoColor=white)](.github/dependabot.yml)
[![Code license: MIT](https://img.shields.io/badge/code-MIT-1b1b1b.svg)](LICENSE.md)

Source for [futhr.io](https://futhr.io/): a prerendered editorial showcase of ventures,
open-source libraries, research, and talks. SvelteKit 2, Svelte 5, Tailwind CSS 4,
TypeScript, deployed to Cloudflare. Application code is MIT; editorial copy and marks
are excluded, see [LICENSE.md](LICENSE.md).

## Quick start

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium   # once, for browser tests
pnpm dev                                # http://127.0.0.1:5173
pnpm storybook                          # http://127.0.0.1:6006
```

Requires Node 24 (`.nvmrc`) and pnpm 11.24.0 (`packageManager`).

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

CI runs the same sequence on pull requests and pushes to `main`, uploads coverage to
Codecov, and dry-runs the Storybook deployment.

## How it works

```text
src/lib/content/*.md ─▶ src/lib/server/content.ts ─▶ showcase.svelte ─▶ build/
   frontmatter + Markdown     validate, order, render,     rows, footer,     prerendered
                              sanitise                     agent documents  HTML + assets
```

- Every entry is a Markdown file with `order`, `group`, `title`, `lede`, `repositories`,
  `links`. Consecutive entries with the same `group` form a section; the group name is
  the divider label on its first row. The build rejects gaps, duplicates, missing
  fields, unsafe link protocols, and non-kebab filenames.
- Rendered Markdown passes an HTML allowlist (`p`, `strong`, `em`, `code`, lists,
  links) before it reaches a component.
- `src/lib/config/site.ts` holds every string, link, and metadata value; it also feeds
  the manifest, JSON-LD, robots, and sitemap.
- Layout tokens are container-relative, measured against a 1440px reference, so the
  same composition holds on the site and inside Storybook frames.
- The brand colour rotates by weekday (`src/lib/config/palette.ts`), applied before
  first paint.
- A service worker keeps the site available offline: network-first for HTML, cache-first
  for hashed assets.

## Layout

| Path | Contents |
| --- | --- |
| `src/lib/components/` | Production components; `logos/` holds the SVG marks |
| `src/lib/config/` | `site.ts` identity and strings, `palette.ts` weekly colours |
| `src/lib/content/` | Ordered Markdown entries |
| `src/lib/server/` | Content loader, validation, agent document generators |
| `src/lib/styles/site.css` | Tailwind theme, layout tokens, global rules |
| `src/routes/` | The page plus generated `llms.txt`, `llms-full.txt`, `agents.md`, `agents/stack.md`, `work/<slug>.md`, manifest, robots, sitemap |
| `tests/` | `components/` Vitest browser, `stories/` Storybook, `e2e/` and `storybook-e2e/` Playwright, unit tests at the top level |
| `docs/` | Architecture, legal, and security records; [index](docs/README.md) |
| `.claude/` | Agent skills and settings; [AGENTS.md](AGENTS.md) is the canonical contract |
| `static/` | Icons, `_headers`, font licence |

Conventions: kebab-case filenames, `$lib` imports, no barrel files, at most one public
symbol per module.

## Deployment

Two independent artifacts, each with its own Wrangler config and Cloudflare project:
the site (`wrangler.toml`, `build/`) and Storybook (`wrangler.storybook.toml`,
`storybook-static/`, `noindex`). The complete guide, including Workers static assets,
headers and CSP, custom domains and TLS, GitHub Actions deployment, and token scoping,
is [docs/architecture/cloudflare.md](docs/architecture/cloudflare.md).

## For agents

[AGENTS.md](AGENTS.md) is the contract; `CLAUDE.md` imports it. Skills under
`.claude/skills/` cover editorial voice, prose cleanup, Svelte 5 rules, and commit
rules. The deployed site serves the same guidance at `/agents.md`, a version matrix at
`/agents/stack.md`, and the portfolio as Markdown at `/llms.txt`, `/llms-full.txt`, and
`/work/<slug>.md`.

## Policies

[SECURITY.md](SECURITY.md) · [CONTRIBUTING.md](CONTRIBUTING.md) ·
[SUPPORT.md](SUPPORT.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) ·
[POLICIES.md](POLICIES.md) · [TRADEMARKS.md](TRADEMARKS.md) ·
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)
