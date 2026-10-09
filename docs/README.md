# Development guide

[![CI](https://github.com/futhr/futhr/actions/workflows/ci.yml/badge.svg)](https://github.com/futhr/futhr/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/futhr/futhr/branch/main/graph/badge.svg)](https://codecov.io/gh/futhr/futhr)
[![Storybook](https://img.shields.io/badge/storybook-ui.futhr.io-1b1b1b?logo=storybook&logoColor=dcdbd6)](https://ui.futhr.io/)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Ffuthr.io&label=futhr.io&color=1b1b1b)](https://futhr.io/)
[![Checked with Biome](https://img.shields.io/badge/checked_with-Biome-60a5fa?logo=biome&logoColor=white)](https://biomejs.dev/)
[![Svelte 5](https://img.shields.io/badge/svelte-5-ff3e00?logo=svelte&logoColor=white)](https://svelte.dev/)
[![Node 24](https://img.shields.io/badge/node-%3E%3D24-5fa04e?logo=node.js&logoColor=white)](../.nvmrc)
[![pnpm](https://img.shields.io/badge/pnpm-12-f69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
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

Node 24 (`.nvmrc`) and pnpm 12.10.1 (`packageManager` in `package.json`).

The venture waitlists are a separate Worker: `pnpm --filter waitlist dev` serves
them on `http://127.0.0.1:8787/`, which lists the seven brands on their
`<id>.localhost` stand-ins. Details in the "Viewing it locally" section of
[apps/waitlist/README.md](../apps/waitlist/README.md). The showcase has no
`/waitlist` route.

## Commands

| Command | Does |
| --- | --- |
| `pnpm quality` | Biome lint and format check, one-export-per-module rule |
| `pnpm check` | svelte-check and the service-worker TypeScript project |
| `pnpm test:unit` | Content loader, agent documents, palette, site config, artifact boundaries; coverage gated |
| `pnpm test:components` | Components in headless Chromium; coverage gated |
| `pnpm test:storybook` | Story rendering, interactions, axe |
| `pnpm test:e2e` | Builds, then Playwright on desktop and mobile Chromium |
| `pnpm test:storybook:e2e` | Builds Storybook, then tests the static artifact |
| `pnpm test:all` | Quality, types, and all test suites for all three packages |
| `pnpm build` | Prerenders to `build/` and verifies the artifact |
| `pnpm preview` | Serves `build/` for audits; restart after each rebuild |
| `pnpm storybook:build` | Static Storybook to `storybook-static/` |
| `pnpm storybook:deploy` | Builds and deploys Storybook with Wrangler |
| `pnpm redirects:deploy` | Deploys the legacy-domain-to-Futhr redirect Worker |
| `pnpm build:exk-passwd` | Builds the ExkPasswd PWA and Chromium/Firefox extensions |
| `pnpm check:exk-passwd` | Type-checks the ExkPasswd browser package |
| `pnpm test:exk-passwd` | Runs the ExkPasswd unit and cross-browser suites |
| `pnpm build:waitlist` | Builds the waitlist Worker and its assets to `apps/waitlist/.svelte-kit/cloudflare/` |
| `pnpm check:waitlist` | Runtime types, svelte-check, and TypeScript for the waitlist app |
| `pnpm test:waitlist` | Waitlist unit, Workers runtime, and Playwright suites |
| `pnpm waitlist:icons` | Regenerates the brand icons from the mark components |
| `pnpm build:landing` | Builds the stateless landing Worker and checks its artifact |
| `pnpm check:landing` | Generated runtime types and Svelte/TypeScript checks |
| `pnpm test:landing` | Landing unit, component, Workers runtime, and browser tests |
| `pnpm landing:icons` | Regenerates landing icons after mark/copy changes |

CI checks all four workspace packages on pull requests and pushes to `main`, uploads
showcase coverage to Codecov, and dry-runs the redirect, Storybook, and both
waitlist Workers, plus the landing Worker. Nothing is deployed by CI.

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
| `.agents/skills/` | Shared agent skills; [AGENTS.md](../AGENTS.md) is the canonical contract |
| `apps/waitlist/` | Venture waitlist Workers, a pnpm workspace package; see its [README](../apps/waitlist/README.md) |
| `apps/landing/` | Stateless project landing Worker; see its [README](../apps/landing/README.md) |

Conventions: kebab-case filenames, `$lib` imports, no barrel files, at most one
public symbol per module. Entries are Markdown with `order`, `group`, `title`,
`lede`, `repositories`, and `links` in frontmatter; the build rejects gaps,
duplicates, missing fields, unsafe link protocols, and non-kebab filenames.

## Dependencies

pnpm only, exact versions, lockfile committed and installed with
`--frozen-lockfile` in CI. `pnpm-workspace.yaml` sets `minimumReleaseAge` to a
day, so a version is not pulled in the hour it is published. Overrides pin
`postcss`, the patched `cookie` release used by SvelteKit, and Miniflare's
patched `sharp` release. Updates are made by
hand; there are no update bots. Review
a dependency before adding it and remove packages that stop being used.

The 9 October 2026 update reviewed the upstream release notes before changing
pins. Svelte 5.57.2 fixes reactivity and hydration edge cases; Vite 8.3.3 fixes
development-server file checks; Storybook 10.6.1 and Svelte CSF 5.1.5 fix build,
accessibility, and story rendering issues. Biome 2.5.15 adds the enforced
`noSvelteExportLet` and `useSvelteKitRuneImports` rules. Playwright 1.64.0's
native WebMCP API now exercises the portfolio's list, read, and open tools in
Chromium. Wrangler 4.148.0 and its Vitest plugin 1.3.7 refresh the Workers
runtime; Node typings remain on the Node 24 line. pnpm 12.10.1 adds stricter
workspace-setting checks and includes package integrity and install fixes.
Codecov 7.1.1 retries verification-key imports and cleans its downloaded CLI
out of the job workspace with `cleanup: true`.

Marked 18.1.0 and sanitize-html 2.18.0 include parser and sanitising fixes.
Refreshing transitive dependencies picks up devalue 5.9.4 and source-map-js
1.2.2. The Miniflare override selects sharp 0.35.5 because the upstream pin
still selects 0.35.4. YAML 2.9.1 replaces gray-matter and removes its unpatched
sprintf-js dependency chain. Frontmatter is now YAML only, rejects duplicate
keys and aliases, and reports malformed blocks with their filenames.

TypeScript 7 is held while svelte-check's peer range ends at TypeScript 6;
Vitest 5 is held while the Cloudflare plugin allowed by the release-age policy
requires Vitest 4.
Vite, Cloudflare, and setup-node releases published within the one-day release
window are deferred. SvelteKit 3 and its new adapters require a coordinated
migration of config, imports, service workers, and form response behavior; this update
retains SvelteKit 2 and the current adapter contract.

Sources: [Svelte](https://github.com/sveltejs/svelte/releases/tag/svelte%405.57.2),
[Vite](https://github.com/vitejs/vite/releases/tag/v8.3.3),
[Storybook](https://github.com/storybookjs/storybook/releases/tag/v10.6.1),
[Svelte CSF](https://github.com/storybookjs/addon-svelte-csf/releases/tag/v5.1.5),
[Biome](https://github.com/biomejs/biome/releases/tag/%40biomejs/biome%402.5.15),
[Playwright](https://playwright.dev/docs/release-notes#version-164),
[Cloudflare](https://github.com/cloudflare/workers-sdk/blob/main/packages/wrangler/CHANGELOG.md),
[Marked](https://github.com/markedjs/marked/releases/tag/v18.1.0),
[sanitize-html](https://github.com/apostrophecms/apostrophe/blob/main/packages/sanitize-html/CHANGELOG.md),
[devalue](https://github.com/sveltejs/devalue/releases/tag/v5.9.4),
[source-map-js](https://github.com/advisories/GHSA-68fv-2mgg-jv7q),
[sharp](https://github.com/lovell/sharp/releases/tag/v0.35.5),
[YAML](https://github.com/eemeli/yaml/releases/tag/v2.9.1),
[sprintf-js advisory](https://github.com/advisories/GHSA-hp3w-g68c-fv3c),
[SvelteKit migration](https://svelte.dev/docs/kit/migrating-to-sveltekit-3),
[pnpm 12](https://github.com/pnpm/pnpm/releases/tag/v12.0.0),
[pnpm 12.10.1](https://github.com/pnpm/pnpm/releases/tag/v12.10.1), and
[Codecov changes](https://github.com/codecov/codecov-action/compare/v7.0.0...v7.1.1).

## Documents

| Document | Purpose |
| --- | --- |
| [architecture/showcase.md](architecture/showcase.md) | How the site works: composition, motion, content pipeline, colour, offline, icons, agent surface, verification |
| [architecture/cloudflare.md](architecture/cloudflare.md) | Current Pages and Workers configurations, waitlist provisioning, DNS and mail, deployment commands, headers, and the optional Pages migration |
| [architecture/exk-passwd-browser.md](architecture/exk-passwd-browser.md) | Production architecture for ExkPasswd in AtomVM/WebAssembly: WebCrypto, static Cloudflare hosting, PWA and browser extensions, security, testing, provenance, and OSS automation |
| [architecture/project-landings.md](architecture/project-landings.md) | WoTEx landing architecture and historical three-domain release audit; Reloved and Recetas now use waitlists |
| [architecture/waitlist-platform.md](architecture/waitlist-platform.md) | Why the waitlists are a separate Worker: boundaries, request flow, data protection, consent, and the decisions still open |
| [legal/accessibility.md](legal/accessibility.md) | Accessibility statement |
| [legal/privacy.md](legal/privacy.md) | Privacy information for the static site |
| [legal/waitlist-operations.md](legal/waitlist-operations.md) | Manual request verification, response deadlines, retention, reviewer limits, and pre-collection setup |

Licence and excluded material: [LICENSE.md](../LICENSE.md). Names and marks:
[TRADEMARKS.md](../TRADEMARKS.md). Reporting a vulnerability:
[SECURITY.md](../SECURITY.md). Agent guidance is [AGENTS.md](../AGENTS.md) with
the skills under `.agents/skills/`; the deployed site serves the same guidance at
`/agents.md` and `/agents/stack.md`.
