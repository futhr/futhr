# AGENTS.md

Guidance for AI coding agents working on the futhr.io site. This file is the
canonical contract; `CLAUDE.md` imports it and adds Claude Code specifics.

## What this repo is

The production source for https://futhr.io/, a single-page editorial showcase of
one person's ventures, open-source libraries, research, and talks. SvelteKit 2 and
Svelte 5 with TypeScript, Tailwind CSS v4, prerendered to `build/` by
`@sveltejs/adapter-static` and deployed to Cloudflare. Markdown entries in
`src/lib/content/` are validated, rendered, and sanitised at build time by
`src/lib/server/content.ts`. Storybook is a development and review surface only;
`scripts/verify-artifact.ts` fails the build if a story file leaks into `build/`.

The venture waitlists are a separate workspace package, `apps/waitlist/`: two
Cloudflare Workers, one for the public waitlists and one for the private admin
API, with their own build, tests, and artifacts. They reuse the showcase style system and marks and nothing else.
`apps/waitlist/README.md` is their operating guide.

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

Node 24 is selected by `.nvmrc`; pnpm 11.24.0 is pinned in `package.json` and `.nvmrc`.

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
pnpm check:waitlist      # types for the waitlist Workers and components
pnpm test:waitlist       # waitlist unit, Workers runtime, and Playwright suites
pnpm build:waitlist      # build the waitlist Worker and its assets
```

`pnpm quality` and `pnpm check` are fast; run them after every change. Run the
suites that touch what you changed before saying a task is done.

## Structure

```
src/lib/components/        production components; logos/ holds the SVG marks
src/lib/client/            browser-only integrations (WebMCP tools), feature-detected
src/lib/config/site.ts     identity, strings, links, and generated documents
src/lib/content/*.md       ordered showcase entries (frontmatter + Markdown)
src/lib/server/content.ts  frontmatter validation, ordering, Markdown, sanitising
src/lib/styles/site.css    Tailwind theme, layout tokens, global rules
src/routes/                the page, generated metadata, and the agent documents
                           (llms.txt, llms-full.txt, agents.md, agents/stack.md,
                           work/<slug>.md), all prerendered
tests/components/          Vitest browser tests
tests/stories/             Storybook stories with play functions
tests/e2e/                 Playwright against the built site
tests/storybook-e2e/       Playwright against the built Storybook
docs/                      architecture and legal records; README.md is the development guide
apps/waitlist/             venture waitlist Workers; see apps/waitlist/README.md
```

## Content model

Each entry is `src/lib/content/<slug>.md`. Frontmatter fields: `order` (positive,
contiguous across the collection), `group`, `title`, `lede`, `repositories`,
`links`. Consecutive entries with the same `group` form one section and the group
name prints as a divider label on the first row. The first entry opens by default.
Row colours alternate starting with ink. Copy rules, link rules, and disclosure
limits are in `.claude/skills/showcase-voice/SKILL.md`. The content files are the
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
- The footer's "for agents" list points at the agent documents generated by
  `src/lib/server/agent-documents.ts`: this file served as `/agents.md`, a stack
  matrix from `package.json`, `llms.txt` per llmstxt.org, `llms-full.txt`, and
  one Markdown file per entry. Keep the list in `site.ts` and the endpoints in
  step; the unit test covers the generators.
- Venture marks in the footer follow the order in `marks.svelte`.
- Layout tokens in `site.css` use container units (`cqw`), and rows and the
  footer are `@container` elements with `@max-5xl` and `@max-3xl` variants, so
  the composition holds inside Storybook frames. Use container units and
  variants, never `vw` or viewport breakpoints, in components.
- The brand colour rotates by weekday: `src/lib/config/palette.ts` documents the
  seven values, `site.css` declares them, and the inline script in `app.html`
  sets `data-day` before first paint. `tests/palette.test.ts` keeps the three in
  sync and checks contrast. Preview them in the Brand/Weekly colours story.
- Marks use `currentColor`; an inverse area uses `var(--mark-contrast)`, which
  defaults to ink. Set it to paper in a paper-coloured context.
- Favicon and app icons carry their own ink background; never rely on
  `prefers-color-scheme` inside an icon, browsers cache one render. Regenerate
  PNGs from the SVG when the mark changes; `/icons/*` is cached for a day, not
  immutable.
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
- Audit performance against `pnpm build && pnpm preview`, never the dev server;
  Lighthouse on the dev server measures unminified Vite modules. Run it with
  `pnpm dlx lighthouse <url> --preset=desktop` and the default mobile preset.
  A preview started before a rebuild serves stale file lists; restart it.
- The service worker is registered in dev too. It is network-first for HTML and
  generated documents and cache-first only for hashed `/_app/immutable/` files.
  Never make HTML cache-first again; it made every dev change invisible.

## Waitlist app

- `src/lib/brands/brands.ts` is a closed map keyed by brand id. Hosts are exact
  apexes; the Worker resolves the brand from the hostname, redirects `www` to
  the apex, and sends any other hostname to futhr.io without serving anything.
  Adding a brand means a mark component, icons from `pnpm waitlist:icons`, and
  a Custom Domain, in that order.
- Copy follows `showcase-voice`. Write "waitlist" as one word everywhere.
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
- Nothing is emailed. Joining ends on the page and the list is read through the
  admin API. Never log an address or an authorization header.

## Git

Commit messages are one line, `<type>: <subject>`, imperative, lower-case, no
body, no trailers, no co-author or tool attribution. Commit only when asked.
Never push, force-push, or rewrite history unless asked. Full rules:
`.claude/skills/git-commit/SKILL.md`.

## Definition of done

`pnpm quality` and `pnpm check` are clean, the affected suites pass, and for
visual work a screenshot at 1440px has been compared against the reference. Say
plainly what was verified and what was not.
