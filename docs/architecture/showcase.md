# Showcase architecture

How futhr.io is put together, feature by feature. The development guide in
[docs/README.md](../README.md) covers commands and layout; the deployment guide in
[cloudflare.md](cloudflare.md) covers hosting. This page explains the decisions
behind what a visitor, a browser, or an agent meets on the page.

## Composition

The page is one column of rows. Each row is an entry: a group label on the left,
a headline in display type, and, when open, an ingress in the left column and a
description in the right. At most one row is open at a time; the first opens by
default, and clicking an open row closes it. Rows alternate ink and paper backgrounds, starting with ink, and the
page background is ink so overscroll never flashes a different colour.

Every measurement comes from a 1440px reference composition and is expressed in
container-query units (`cqw`) rather than viewport units. On the site the
container is the viewport, so nothing changes; inside a Storybook frame the same
tokens scale to the frame, which is why stories match production. Below 1024px
the open row stacks ingress above description, below 768px the label overlays
the inset above the headline and type steps down; both are container queries, so
a narrow story frame behaves like a phone.

The collapsed row is a fixed height with the headline's cap line sitting a fixed
distance below the top edge; the next row clips the rest at half the headline's
em. Below 768px the group label overlays the inset instead of taking a line, so
labelled and unlabelled rows are the same height and show the same slice of
their headline. Titles with soft hyphens break where the author decided, not
where the browser guesses.

## Motion

When a row opens, the closing and opening rows animate their heights over
420ms through the Web Animations API. `src/lib/client/row-glide.ts` drives
scrolling on the same curve, using the settled heights of the preceding rows.
A closing row reports the last keyframe's height, so the target does not need
per-frame layout measurements. The component cancels animations on teardown.

The ingress and body fade in with a short stagger. An open row is at least one
viewport tall. Wheel, touch, pointer, or key input cancels the scroll glide;
reduced-motion preferences apply the final state directly. Performance results
are specific to the measured build and device, not a frame-rate guarantee.

## Content pipeline

Entries are Markdown files with YAML frontmatter in `src/lib/content/`. At build
time the loader validates fields, requires a contiguous `order`, renders Markdown,
and sanitises the result to an allowlist: paragraphs, bold, italic, code, lists,
links. Consecutive entries sharing a `group` form a section; the group name is the
label on the first row of the section. Copy follows the editorial rules in
`.claude/skills/showcase-voice/SKILL.md`, and the emphasis in the text is
authored, not generated: bold for the product name at first mention, and an
italic closing line that lands each entry in one sentence.

`src/lib/config/site.ts` holds the site identity, navigation, and metadata, and
feeds the web manifest, JSON-LD, robots, and sitemap. Entry copy stays in Markdown.

## Typography and colour

Archivo Variable in regular and italic, self-hosted and preloaded, with the
single stylesheet inlined into the HTML so first paint has no blocking request.
Two fixed colours, ink and paper, plus one brand colour that changes with the
weekday: seven decorative hues, declared in
`src/lib/config/palette.ts` and `site.css`, selected before first paint by an
inline script that sets `data-day` on the root element. The raw colour accents
the hand-drawn marker underline. Small text on ink uses `signal-light`, a blend
with 20 percent paper; text on paper keeps its ink colour. Focus outlines follow
the text colour, with an explicit paper outline around the waitlist button.
The Brand/Weekly colours story shows the seven hues.

Marks are SVG components drawn in `currentColor`; an inverse area uses a contrast
token that defaults to ink, so the same file works on either background and in
the footer, in Storybook, and in exported profile images.

## Offline and icons

A service worker precaches the build and serves hashed assets cache-first, and
HTML and generated documents network-first with the cache as fallback, so a
deploy shows on the next load and the site still opens without a connection.

Icons never depend on the colour scheme. The favicon and app icons carry their
own ink background with a paper glyph, so a light or dark tab strip makes no
difference and the browser's cached render is always right. The set is an SVG
favicon, a 48px PNG for browsers without SVG favicon support, a 180px Apple touch
icon, 192px and 512px any-purpose icons, and a 512px maskable icon whose glyph sits
inside the 80 percent safe circle on an opaque background.

## Agent surface

Agents that fetch URLs get the site as text: `/llms.txt` in the llmstxt.org
shape with a link per entry, `/llms-full.txt` with every entry, `/work/<slug>.md`
per entry, `/agents.md` with the repository's agent contract, and
`/agents/stack.md` with pinned versions read from `package.json` at build time.

Agents that drive the reader's browser get WebMCP tools. When
`document.modelContext` exists, the showcase registers three tools:

| Tool | Input | Effect |
| --- | --- | --- |
| `list-work` | none | Every entry with slug, group, summary, and links |
| `open-entry` | `slug` | Opens that row on the page and scrolls to it |
| `get-entry` | `slug` | Returns the entry as Markdown without touching the page |

Registration is feature-detected and tied to an `AbortController` for cleanup.
The page works without the API. `open-entry` is idempotent: requesting the
already-open entry keeps it open. The local types follow the
[WebMCP draft](https://webmachinelearning.github.io/webmcp/); availability and
trial requirements are described in the current
[Chrome guidance](https://developer.chrome.com/docs/ai/webmcp). No origin-trial
token is committed.

## Verification

Biome and svelte-check gate every change. Vitest covers the content loader, agent
documents, palette, and site config in Node, and every component in headless
Chromium with coverage floors. Storybook stories carry interaction and axe checks
and are built to a separate artifact that must not contain site-only files. Playwright
runs the built site on desktop and mobile Chromium, including an axe scan, offline
loading, and metadata endpoints. Layout work is checked against the reference by
measurement, and performance with Lighthouse against `pnpm preview`.
