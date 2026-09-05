# Showcase architecture

How futhr.io is put together, feature by feature. The development guide in
[docs/README.md](../README.md) covers commands and layout; the deployment guide in
[cloudflare.md](cloudflare.md) covers hosting. This page explains the decisions
behind what a visitor, a browser, or an agent meets on the page.

## Composition

The page is one column of rows. Each row is an entry: a group label on the left,
a headline in display type, and, when open, an ingress in the left column and a
description in the right. Exactly one row is open at a time; the first opens by
default. Rows alternate ink and paper backgrounds, starting with ink, and the
page background is ink so overscroll never flashes a different colour.

Every measurement comes from a 1440px reference composition and is expressed in
container-query units (`cqw`) rather than viewport units. On the site the
container is the viewport, so nothing changes; inside a Storybook frame the same
tokens scale to the frame, which is why stories match production. Below 1024px
the open row stacks ingress above description, below 768px the label stacks
above the headline and type steps down; both are container queries, so a
narrow story frame behaves like a phone.

The collapsed row is a fixed height with the headline's cap line sitting a fixed
distance below the top edge; the next row clips the rest. Titles with soft
hyphens break where the author decided, not where the browser guesses.

## Motion

One curve, one clock, one motion. When a row is clicked, the closing row and the
opening row animate their heights over 420ms on an ease-out curve through the
Web Animations API, and the scroll position travels on the same curve towards
the row's final position, computed from the collapsed-row height rather than
measured per frame. The result is that the clicked header glides from wherever
it was to the top of the viewport while the panel grows beneath it and every
other row moves consistently around it; nothing jumps, nothing is pinned, and
nothing is measured mid-flight, so nothing lags. The ingress, then the
description and links, rise and fade in on a short stagger as the row settles.
An open row is at least one viewport tall, so the destination always exists.
Any wheel, touch, pointer, or key input during the glide hands control back at
once, and users who prefer reduced motion get the final state directly.
Measured on the production build in Chromium at 4x CPU throttling, the motion
holds a full frame rate with no frame over 17ms.

## Content pipeline

Entries are Markdown files with YAML frontmatter in `src/lib/content/`. At build
time the loader validates fields, requires a contiguous `order`, renders Markdown,
and sanitises the result to an allowlist: paragraphs, bold, italic, code, lists,
links. Consecutive entries sharing a `group` form a section; the group name is the
label on the first row of the section. Copy follows the editorial rules in
`.claude/skills/showcase-voice/SKILL.md`, and the emphasis in the text is
authored, not generated: bold for the product name at first mention, and an
italic closing line that lands each entry in one sentence.

`src/lib/config/site.ts` holds every string, link, and metadata value and feeds the
web manifest, JSON-LD, robots, and sitemap.

## Typography and colour

Archivo Variable in regular and italic, self-hosted and preloaded, with the
single stylesheet inlined into the HTML so first paint has no blocking request.
Two fixed colours, ink and paper, plus one brand colour that changes with the
weekday: seven mid-luminance hues chosen to pass on both backgrounds, declared in
`src/lib/config/palette.ts` and `site.css`, selected before first paint by an
inline script that sets `data-day` on the root element. The brand colour drives
hover, focus, and the hand-drawn marker underline on links. The Storybook story
Brand → Weekly colours shows the seven.

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

Registration is feature-detected and tied to an `AbortController`, so browsers
without the API run identical code paths and nothing else changes. WebMCP is an
origin trial in Chrome 149 and Edge 150; for real visitors the trial token goes
in the placeholder comment in `src/app.html`, and locally the flag
`chrome://flags/#enable-webmcp-testing` enables it. The DevTools Application panel
lists the tools and logs calls.

## Verification

Biome and svelte-check gate every change. Vitest covers the content loader, agent
documents, palette, and site config in Node, and every component in headless
Chromium with coverage floors. Storybook stories carry interaction and axe checks
and are built to a separate artifact that must not leak site files. Playwright
runs the built site on desktop and mobile Chromium, including an axe scan, offline
loading, and metadata endpoints. Layout work is checked against the reference by
measurement, and performance with Lighthouse against `pnpm preview`.
