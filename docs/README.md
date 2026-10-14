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

Source for [futhr.io](https://futhr.io/): SvelteKit 3, Svelte 5, Tailwind CSS 4,
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

Node 24 (`.nvmrc`), its locked 24.21.0 script runtime (`devEngines.runtime`),
and pnpm 12.11.2 (`packageManager` in `package.json`).

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
| `pnpm test:all` | Quality, types, and all test suites for all four packages |
| `pnpm build` | Prerenders to `build/` and verifies the artifact |
| `pnpm preview` | Serves `build/` for audits; restart after each rebuild |
| `pnpm storybook:build` | Static Storybook to `storybook-static/` |
| `pnpm storybook:deploy` | Builds and deploys Storybook with Wrangler |
| `pnpm redirects:deploy` | Deploys the legacy-domain-to-Futhr redirect Worker |
| `pnpm build:exk-passwd` | Builds the ExkPasswd PWA and Chromium extension |
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
waitlist Workers, plus the landing Worker. After all four jobs pass on a push to
`main`, CI applies pending waitlist migrations and deploys all six surfaces using
the tested artifacts. Pull requests only run checks. Credential setup and release
ordering are in [Cloudflare deployment](architecture/cloudflare.md#continuous-deployment).

## Layout

| Path | Contents |
| --- | --- |
| `src/lib/components/` | Production components; `marks/` holds the SVG adapters |
| `src/lib/client/` | Browser-only integrations such as the WebMCP tools |
| `src/lib/config/` | `site.ts` identity and strings, `palette.ts` weekly colours |
| `src/lib/content/` | Ordered Markdown entries |
| `src/lib/server/` | Content loader, validation, agent document generators |
| `src/lib/styles/site.css` | Tailwind theme, layout tokens, global rules |
| `src/routes/` | The page plus generated `llms.txt`, `llms-full.txt`, `work/<slug>.md`, manifest, robots, sitemap |
| `tests/` | `components/` Vitest browser, `stories/` Storybook, `e2e/` and `storybook-e2e/` Playwright, unit tests at the top level |
| `static/` | Icons, `_headers`, font licence |
| `.agents/skills/` | Shared agent skills; [AGENTS.md](../AGENTS.md) is the canonical contract |
| `apps/waitlist/` | Venture waitlist Workers, a pnpm workspace package; see its [README](../apps/waitlist/README.md) |
| `apps/landing/` | Stateless project landing Worker; see its [README](../apps/landing/README.md) |

Conventions: kebab-case filenames, `#lib` imports, no barrel files, at most one
public symbol per module. Entries are Markdown with `order`, `group`, `title`,
`lede`, `repositories`, and `links` in frontmatter; the build rejects gaps,
duplicates, missing fields, unsafe link protocols, and non-kebab filenames.

## Dependencies

pnpm only, exact versions, lockfile committed and installed with
`--frozen-lockfile` in CI. The normal one-day release-age policy remains in
`pnpm-workspace.yaml`; the 14 October refresh explicitly selects the reviewed
Cloudflare 1.4.2/4.151.0 runtime set through exact version exclusions. PostCSS
8.5.30 remains pinned. The old cookie and sharp overrides are removed because
SvelteKit 3 selects cookie 2.0.1 and current Miniflare selects sharp 0.35.5.

The showcase, landing, and waitlist now use SvelteKit 3.0.1 with the matching
static and Cloudflare adapters. Configuration lives in the Vite plugins,
`#lib` uses package imports with explicit file extensions, and route matchers
live in `src/params.ts`. Cloudflare bindings come from `cloudflare:workers`;
request host gates, authorization, and CSRF protection remain owned by the
existing routes and Workers. Expected framework errors keep their default
status and safe message; only unknown server failures are logged.

The showcase service worker uses the new manifest objects and its own typed
project. It still fetches HTML and generated documents from the network first
and caches immutable files first. The ExkPasswd product imports published
0.4.1 core bytes with the same qualified compiler and verified Web Crypto
runtime, manifest, checksums, and SBOM.

Storybook uses its own Svelte/Vite config so application adapters cannot
overwrite its static headers and search-indexing controls.

Vitest 5.0.4 moves with the compatible Workers plugin and Storybook 10.6.2.
Workers tests disable Vitest's host filesystem module cache and load transformed
modules through the runner, because Workerd cannot read that Node cache.
Cross-origin mutations without a content type now receive SvelteKit's CSRF
rejection; same-origin routing and method tests supply their origin explicitly.
Vite 8.3.4, Wrangler 4.151.0, Marked 18.1.1, PostCSS 8.5.30, pnpm 12.11.2,
Node 24 typings, and setup-node 7.1.0 include the reviewed maintenance fixes.
TypeScript remains at 6.0.3: SvelteKit requires its 6.x peer range, and
svelte-check does not yet declare TypeScript 7 support.

Sources: [SvelteKit migration](https://svelte.dev/docs/kit/migrating-to-sveltekit-3),
[Vitest migration](https://vitest.dev/guide/migration/),
[Workers plugin](https://github.com/cloudflare/workers-sdk/releases/tag/%40cloudflare%2Fvitest-plugin%401.4.2),
[Wrangler](https://github.com/cloudflare/workers-sdk/releases/tag/wrangler%404.151.0),
[Storybook](https://github.com/storybookjs/storybook/releases/tag/v10.6.2),
[Vite](https://github.com/vitejs/vite/releases/tag/v8.3.4),
[Marked](https://github.com/markedjs/marked/releases/tag/v18.1.1),
[PostCSS](https://github.com/postcss/postcss/releases/tag/8.5.30), and
[pnpm](https://github.com/pnpm/pnpm/releases/tag/v12.11.2).

## Documents

| Document | Purpose |
| --- | --- |
| [architecture/showcase.md](architecture/showcase.md) | How the site works: composition, motion, content pipeline, colour, offline, icons, agent surface, verification |
| [architecture/cloudflare.md](architecture/cloudflare.md) | Current Pages and Workers configurations, waitlist provisioning, DNS and mail, deployment commands, headers, and the optional Pages migration |
| [architecture/exk-passwd-browser.md](architecture/exk-passwd-browser.md) | Production architecture for ExkPasswd in AtomVM/WebAssembly: WebCrypto, static Cloudflare hosting, PWA and browser extensions, security, testing, provenance, and OSS automation |
| [architecture/project-landings.md](architecture/project-landings.md) | WoTEx and Ghostshift landing architecture and historical three-domain release audit; Reloved and Recetas now use waitlists |
| [architecture/waitlist-platform.md](architecture/waitlist-platform.md) | Why the waitlists are a separate Worker: boundaries, request flow, data protection, consent, and the decisions still open |
| [legal/accessibility.md](legal/accessibility.md) | Accessibility statement |
| [legal/privacy.md](legal/privacy.md) | Privacy information for the static site |
| [legal/waitlist-operations.md](legal/waitlist-operations.md) | Manual request verification, response deadlines, retention, reviewer limits, and pre-collection setup |

Licence and excluded material: [LICENSE.md](../LICENSE.md). Names and marks:
[TRADEMARKS.md](../TRADEMARKS.md). Reporting a vulnerability:
[SECURITY.md](../SECURITY.md). Agent guidance is [AGENTS.md](../AGENTS.md) with
the skills under `.agents/skills/`; it is not served by the site.
