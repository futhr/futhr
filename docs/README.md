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

Node 24 (`.nvmrc`), its locked 24.22.3 script runtime (`devEngines.runtime`),
and pnpm 12.21.0 (`packageManager` in `package.json`).

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
`--frozen-lockfile` in CI. The one-day release-age policy in
`pnpm-workspace.yaml` applies to every package; the 18 November refresh needs no
exclusions. PostCSS is pinned at 8.5.33, which satisfies Vite 8.3.8's `^8.5.32`
range. SvelteKit 3 selects cookie 2.0.1 and current Miniflare selects sharp
0.35.5, so neither needs an override.

The showcase, landing, and waitlist use SvelteKit 3.2.1 with static adapter
4.0.1 and Cloudflare adapter 8.0.2. These close GHSA-3r8g-jcqq-3p5j,
GHSA-6cf5-gc4q-fm3x, GHSA-m9j8-jcmv-hp69, GHSA-rqp5-r3wg-vg35,
GHSA-jf9x-2fg2-hx4w, and GHSA-5wg4-q3ww-283h; none of the affected features
(remote functions, server route resolution, Vercel route config, prerendered
`_redirects` rules) is used here. Configuration lives in the Vite plugins,
`#lib` uses package imports with explicit file extensions, and route matchers
live in `src/params.ts`. Cloudflare bindings come from `cloudflare:workers`;
request host gates, authorization, and CSRF protection remain owned by the
existing routes and Workers. Expected framework errors keep their default
status and safe message; only unknown server failures are logged.

The showcase service worker uses the new manifest objects and its own typed
project. It still fetches HTML and generated documents from the network first
and caches immutable files first. The ExkPasswd product imports published
0.4.1 core bytes with the same qualified compiler and verified Web Crypto
runtime, manifest, checksums, and SBOM. `@swmansion/popcorn` stays at 0.3.3
because it must match the runtime recorded for those bytes; Popcorn 1.x needs a
rebuilt core from the `futhr/exk_passwd` release pipeline first.

Storybook uses its own Svelte/Vite config so application adapters cannot
overwrite its static headers and search-indexing controls.

Vitest 5.1.0 moves with Workers plugin 1.8.4 and Storybook 10.6.7. Workers
tests use Vitest's filesystem module cache again; plugin 1.4.3 fixed loading
cached modules in Workerd. Cross-origin mutations without a content type receive
SvelteKit's CSRF rejection; same-origin routing and method tests supply their
origin explicitly. Vite 8.3.8, Wrangler 4.164.0, Marked 18.2.1, sanitize-html
2.18.2, jose 6.2.17, Playwright 1.65.1, pnpm 12.21.0, Node 24.22.3, Node 24
typings, and action-setup 6.1.1 include the reviewed maintenance and security
fixes. TypeScript remains at 6.0.3: SvelteKit 3.2.1 requires its 6.x peer range,
and svelte-check 4.7.8 does not declare TypeScript 7 support. `pnpm audit`
still reports GHSA-fc5q-39xc-vjpf in picomatch 4.0.7, which Vite and Vitest use
for build-time globbing; no patched release exists.

Biome 2.6.8 moved the selected Playwright rules out of nursery into the
`playwright` domain, which `biome.json` enables for Playwright tests and
scripts only. `noPlaywrightUselessAwait` stays off in Workers tests, where it
mistakes D1's `first()` for a Playwright locator. Markdown formatting and
linting stay off because the formatter rewrites content frontmatter and
emphasis; YAML keeps single quotes. `useBaseline` is off for CSS, HTML, and
Svelte because the layout deliberately uses newer features such as
`overflow-anchor`, `round()`, and anchor positioning. `noConditionalExpect`
is off in the app suites, whose data-driven tests branch on project fixtures.

Sources: [SvelteKit migration](https://svelte.dev/docs/kit/migrating-to-sveltekit-3),
[SvelteKit changelog](https://github.com/sveltejs/kit/blob/main/packages/kit/CHANGELOG.md),
[Vitest migration](https://vitest.dev/guide/migration/),
[Workers plugin](https://github.com/cloudflare/workers-sdk/releases/tag/%40cloudflare%2Fvitest-plugin%401.8.4),
[Wrangler](https://github.com/cloudflare/workers-sdk/releases/tag/wrangler%404.164.0),
[Storybook](https://github.com/storybookjs/storybook/releases/tag/v10.6.7),
[Vite](https://github.com/vitejs/vite/releases/tag/v8.3.8),
[Marked](https://github.com/markedjs/marked/releases/tag/v18.2.1),
[PostCSS](https://github.com/postcss/postcss/releases/tag/8.5.33),
[Biome](https://github.com/biomejs/biome/releases/tag/%40biomejs%2Fbiome%402.6.8), and
[pnpm](https://github.com/pnpm/pnpm/releases/tag/v12.21.0).

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
