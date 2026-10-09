# AGENTS.md

The canonical repository contract for AI coding agents working on futhr.io.

## Working instructions

- Read the relevant application code and operating guide before editing. Keep
  changes within the request; preserve unrelated work and local client settings.
- Shared skills live in tracked `.agents/skills/<name>/SKILL.md`. Select and read
  matching skills automatically from their descriptions as the task, changed
  mechanism, or delivery stage requires. The user does not invoke skills or
  choose slash commands. Keep implicit invocation enabled.
- Clients without native skill discovery must read the frontmatter descriptions
  under `.agents/skills/`, select the matching skills, and read their bodies.
  Load linked supporting material only when relevant to the current task.
- Codex discovers `.agents/skills/` natively. For Claude Code, use an ignored
  individual directory symlink at `.claude/skills/<name>` pointing to
  `../../.agents/skills/<name>`. Preserve local entries and repair only links
  owned by this repository. `.claude/` is entirely ignored; do not track client
  settings, hooks, session markers, or agent setup helpers.
- Use plain, concrete prose in chat and files. Cut filler, hype, vague authority,
  and repeated conclusions. Preserve exact identifiers, commands, error strings,
  legal boundaries, and measured results. Keep replies concise without obscuring
  uncertainty or operational consequences.
- Proprietary projects may be described conceptually only. Do not copy their
  source or internal documents into this repository.

## What this repo is

The production source for https://futhr.io/, a single-page editorial showcase of
one person's open-source libraries and research. SvelteKit 2 and
Svelte 5 with TypeScript, Tailwind CSS v4, prerendered to `build/` by
`@sveltejs/adapter-static` and deployed to Cloudflare. Markdown entries in
`src/lib/content/` are validated, rendered, and sanitised at build time by
`src/lib/server/content.ts`. Storybook is a development and review surface only;
`scripts/verify-artifact.ts` fails the build if a story file leaks into `build/`.

The venture waitlists are a separate workspace package, `apps/waitlist/`: two
Cloudflare Workers, one for the public waitlists and one for the private admin
API, with their own build, tests, and artifacts. They reuse the showcase style system and marks and nothing else.
`apps/waitlist/README.md` is their operating guide.

The stateless project landing is a third package, `apps/landing/`, for WoTEx.
It shares marks and the style system, but no waitlist
data or components. `apps/landing/README.md` is their operating guide. The
production Worker must retain its outer host gate and Worker-first asset
routing; the adapter's build-only config must never be deployed.

`apps/exk-passwd/` builds the ExkPasswd PWA and browser extensions and is
integrated into the showcase artifact at `/exk-passwd/`. Its operating guide is
`apps/exk-passwd/README.md`; the canonical password implementation belongs to
the separate Elixir library. Do not hand-edit its imported `browser-core/` bytes.

The page is built to a reference design measured at 1440px wide. Layout values are
container-relative and documented at the top of `src/lib/styles/site.css`. When a
layout change is requested, measure the result against the reference before
reporting; the maintainer checks cap-height offsets, column starts, row heights,
and line breaks, not only the general look.

## Setup

```bash
pnpm install
pnpm exec playwright install --with-deps chromium   # first time only
```

Node 24 is selected by `.nvmrc`; pnpm 12.10.1 is pinned in `package.json`.

## Commands

```bash
pnpm dev                 # SvelteKit dev server with HMR on :5173
pnpm storybook           # Storybook on :6006
pnpm quality             # Biome lint + format check + export constraints
pnpm check               # svelte-check and the service-worker tsconfig
pnpm test:unit           # content loader and site config, with coverage
pnpm test:components     # components in headless Chromium, with coverage
pnpm test:storybook      # story rendering, interactions, axe
pnpm test:e2e            # builds, then Playwright on desktop and mobile Chromium
pnpm test:storybook:e2e  # builds Storybook, then tests the static artifact
pnpm test:all            # everything above, in CI order
pnpm build               # production build plus artifact verification
pnpm check:exk-passwd     # types for the ExkPasswd browser package
pnpm test:exk-passwd      # ExkPasswd unit and browser suites
pnpm build:exk-passwd     # ExkPasswd PWA and browser extensions
pnpm check:waitlist      # types for the waitlist Workers and components
pnpm test:waitlist       # waitlist unit, Workers runtime, and Playwright suites
pnpm build:waitlist      # build the waitlist Worker and its assets
pnpm check:landing       # generated runtime types and Svelte checks
pnpm test:landing        # unit, component, workerd, and browser tests
pnpm build:landing       # build the stateless Worker and verify its artifact
pnpm landing:icons       # regenerate landing icons after mark/copy changes
```

`pnpm quality` and `pnpm check` are fast; run them after every change. Run the
suites that touch what you changed before saying a task is done.

## Structure

```
src/lib/marks/             standalone monochrome project marks
src/lib/components/        production components; marks/ and icons/ hold adapters
src/lib/client/            browser-only integrations (WebMCP tools), feature-detected
src/lib/config/site.ts     identity, strings, links, and generated documents
src/lib/content/*.md       ordered showcase entries (frontmatter + Markdown)
src/lib/server/content.ts  frontmatter validation, ordering, Markdown, sanitising
src/lib/styles/site.css    Tailwind theme, layout tokens, global rules
src/routes/                the page, generated metadata, and the agent documents
                           (llms.txt, llms-full.txt, sitemap.xml, work/<slug>.md),
                           all prerendered
tests/components/          Vitest browser tests
tests/stories/             Storybook stories with play functions
tests/e2e/                 Playwright against the built site
tests/storybook-e2e/       Playwright against the built Storybook
docs/                      architecture and legal records; README.md is the development guide
apps/waitlist/             venture waitlist Workers; see apps/waitlist/README.md
apps/landing/              stateless landing Worker; see apps/landing/README.md
apps/exk-passwd/            password PWA and extensions; see apps/exk-passwd/README.md
```

## Content model

Each entry is `src/lib/content/<slug>.md`. Frontmatter fields: `order` (positive,
contiguous across the collection), `group`, `title`, `lede`, `repositories`,
`links`, and optional `kerning` (headline letter pairs the font does not kern, with
the extra tracking in em). Consecutive entries with the same `group` form one section and the group
name prints as a divider label on the first row. The first entry opens by default.
Row colours alternate starting with ink. Copy rules, link rules, and disclosure
limits are in `.agents/skills/editorial/SKILL.md`. The content files are the
only copy of the approved text; `docs/README.md` indexes the remaining documents.

## Conventions and gotchas

- Kebab-case filenames, `$lib` imports, no barrel files, at most one public symbol
  per module (`scripts/check-exports.ts` enforces this).
- Biome is strict and formats with single quotes and no semicolons. Prettier is
  not used. `void expr`, empty blocks, and regex literals inside functions are
  lint errors.
- Every component must be rendered by a test in `tests/components/`; coverage
  thresholds treat an unrendered component as zero and fail the suite.
- Story ids are asserted in `tests/storybook-e2e/storybook.test.ts`. Adding a
  story means adding its id there.
- The showcase has no hooks, generated scripts, client-side data fetching, or UI kit.
  The waitlist uses SvelteKit hooks for hostname routing.
  Copy lives in `site.ts` or content files, never in components.
- The footer's "for agents" list is the portfolio's machine-readable surface,
  generated by `src/lib/server/agent-documents.ts`: `llms.txt` per llmstxt.org,
  `llms-full.txt`, `sitemap.xml`, and one Markdown file per entry. It describes
  the portfolio for agents and crawlers; it never serves repository guidance.
  Keep the list in `site.ts` and the endpoints in step; the unit test covers
  the generators. Every footer link opens in a new tab. The page's JSON-LD comes
  from `src/lib/server/structured-data.ts` and must only state what the page or
  the generated documents show.
- Venture marks in the footer follow the order in `marks.svelte`.
- Layout tokens in `site.css` use container units (`cqw`), and rows and the
  footer are `@container` elements with `@max-5xl` and `@max-3xl` variants, so
  the composition holds inside Storybook frames. Use container units and
  variants, never `vw` or viewport breakpoints, in components.
- The brand colour rotates by weekday: `src/lib/config/palette.ts` documents the
  seven values, `site.css` declares them, and the inline script in `app.html`
  sets `data-day` before first paint. `tests/palette.test.ts` keeps the three in
  sync and checks contrast. Preview them in the Brand/Weekly colours story.
- Project marks are standalone monochrome SVGs in `src/lib/marks/`, using a
  narrow warm-gray palette with transparent counterforms for ink backgrounds.
- The SVG favicons are transparent: `favicon.svg` switches between ink and paper
  with `prefers-color-scheme` in its own `<style>`, and the scheme-specific links
  serve a single-colour glyph each. The PNG fallback and the app icons carry
  their own ink background. Regenerate everything with `pnpm site:icons` when the
  mark changes; `/icons/*` is cached for a day, not immutable.
- WebMCP tools live in `src/lib/client/model-context.ts`, registered only when
  `document.modelContext` exists. Keep the page fully functional without it.
- Vitest configs: `vitest.config.ts` (Storybook project, must keep that name so
  the Storybook Vitest addon can find it), `vitest.unit.config.ts`,
  `vitest.browser.config.ts`. `vite.config.ts` holds no test settings.
- Storybook static assets live under `.storybook/static/brand/`; the artifact
  check rejects anything under `icons/` or other web-only paths.
- Opening a row drives the scroll position on the same 420ms curve as the row
  height animations (`src/lib/client/fold-motion.ts`), towards a target summed
  from the settled heights of the rows above (a closing row reports its last
  keyframe), so the header glides to the top with no per-frame measurement. `body` has `overflow-anchor: none` and there is no
  `scroll-behavior: smooth`, both on purpose: scroll anchoring and smooth
  programmatic scrolls each moved the header out of view. Measure before
  changing any of this.
- `content-visibility: auto` on rows breaks full-page screenshots and
  measurements. Do not reintroduce it.
- The dev server 500s when any content file has invalid frontmatter; the error
  names the file.
- Measure performance against `pnpm build && pnpm preview`, never the dev server;
  Lighthouse on the dev server measures unminified Vite modules. Run it with
  `pnpm dlx lighthouse <url> --preset=desktop` and the default mobile preset.
  A preview started before a rebuild serves stale file lists; restart it.
- The service worker is registered in dev too. It is network-first for HTML and
  generated documents and cache-first only for hashed `/_app/immutable/` files.
  Never make HTML cache-first again; it made every dev change invisible.

## Waitlist app

- `src/lib/brands/brands.ts` is a closed map keyed by brand id. Hosts are exact
  apexes; the Worker resolves the brand from the hostname, redirects `www` to
  the apex, redirects the explicit `orvane.ai` and `www.orvane.ai` aliases to
  `orvane.io`, and sends any other hostname to futhr.io without serving
  anything. Adding a brand means a mark component, icons from
  `pnpm waitlist:icons`, and a Custom Domain, in that order.
- Copy follows the editorial skill.
- Icons under `apps/waitlist/static/brands/` are generated and committed;
  regenerate them when a mark changes. The unit tests compare the SVGs to the
  mark source and check every PNG size.
- The public Worker is SvelteKit on `@sveltejs/adapter-cloudflare`, rendered
  per request: `src/hooks.ts` reroutes every path on a venture hostname into
  `src/routes/brands/[brand=brand]/`, `src/hooks.server.ts` resolves the brand and
  sets the headers, and `svelte.config.ts` holds the page CSP. The admin Worker
  is the plain module `src/admin-worker.ts`, type-checked against the generated
  `worker-configuration.d.ts` by `tsconfig.worker.json`. Biome resolves `$lib`
  only under `src/`, so tests in the package import relatively.
- The Workers send no email and invoke no AI. Joining ends on the page; `/withdraw`
  queues a separate request without deleting or suspending a subscription.
  Reviewers receive metadata only; operator resolution requires evidence and
  commits deletion, closure, and audit together. Preserve the original subscription
  ID so a stale request cannot erase a later join. Manual handling and retention
  follow `docs/legal/waitlist-operations.md`. Never log an address or an
  authorization header.

## Git

- Commit only when asked. Never push, force-push, or rewrite history unless asked.
- Keep each commit a logical change. Inspect the diff and stage only the requested
  work; keep build artifacts, coverage, dependencies, and client state out of Git.
- Use a single line, `<type>: <subject>`, with an imperative subject starting in
  lower-case and no trailing period. Types: `feat`, `fix`, `content`, `style`,
  `docs`, `test`, `refactor`, `perf`, `build`, `ci`, `chore`.
- No scope, emoji, ticket number, URL, body, trailers, co-author, tool attribution,
  or session identifier. Authorship is the Git author only.
- Run the required checks before committing and report any check that could not
  run. Do not describe an attempted check as passing.

## Definition of done

`pnpm quality` and `pnpm check` are clean, the affected suites pass, and for
visual work a screenshot at 1440px has been compared against the reference. Say
plainly what was verified and what was not.
