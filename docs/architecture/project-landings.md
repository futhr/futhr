# Project landing pages

Status: deployed on 8 September 2026 to all six Custom Domains.
This specification defines a shared holding-page application
for project domains that need a credible public root without collecting an
address, promising a release, or publishing a complete documentation site.

The first release covers `wotex.io`, `reloved.eco`, and `recetas.co.com`. It is
separate from both the showcase and the venture waitlists. WoTEx will eventually
replace its holding page with documentation; the other domains can move to
their own applications without changing this page's contract.

## Purpose and boundary

The page establishes identity and one useful destination while a fuller public
surface does not exist. It is a real project page, not a “coming soon” screen.
It contains no waitlist, contact form, countdown, release date, account, cookie,
analytics tag, remote font, email capture, database binding, or AI integration.

One Worker serves the three exact apex hostnames. Each `www` hostname redirects
permanently to its apex with the path and query string intact. A brand is always
derived from the request hostname; it never comes from a path, query, header, or
client-supplied field.

The boundary changes the existing waitlist plan: Reloved has no invitation or
release notification to offer, so `reloved.eco` must leave `waitlist-web` before
either Worker is deployed. WoTEx is open source rather than a venture waitlist.
Recetas now has a Venture entry in the showcase and an approved toast mark in the footer.

## Initial content

Public copy stays in a closed, typed map rather than in components. Empty
optional fields remove their whole visual region; the page never prints a
placeholder label, dummy link, or “coming soon”.

| Field | WoTEx | Reloved | Recetas |
| --- | --- | --- | --- |
| Host | `wotex.io` | `reloved.eco` | `recetas.co.com` |
| Name | WoTEx | Reloved | Recetas |
| Mark | Existing `wotex.svelte` | Existing `reloved.svelte` | Approved `recetas.svelte` toast with transparent interior |
| Statement | “One standard for Things, and a runtime built to keep them running.” | “Owned locally. Found together.” | “Plan meals. Keep the kitchen in sync.” |
| Supporting line | “Open-source Web of Things libraries for Elixir and the BEAM.” | “Exploring household-owned resale networks.” | “Pi-hosted kitchen automation with Home Assistant and Nx.” |
| Primary link | `github.com/wotex-project` | `github.com/reloved-eco` | None approved; omit |
| Link kind | Open source | Organization | None |
| Indexing | Index | Index | Index |

The supplied Reloved wording and existing WoTEx wording are approved inputs.
The Recetas checkout and private `futhr/recetas` repository were inspected on
8 September 2026. Its README supports the conceptual showcase entry about
household recipes, meal planning, home automation, and Raspberry Pi hosting.
The approved landing copy focuses on that local kitchen system and names Home
Assistant and Nx without linking the private repository. Adding or revising
copy remains a content change, not a component change.

The user-approved toast replaces the temporary `R` in
`src/lib/components/logos/recetas.svelte`. Its four paths use `currentColor`; an
even-odd counterform makes the interior transparent. The flat mark has no
shadow. The footer includes it as the eighth mark, preserving the preceding
seven marks' order and reducing their common grid width slightly.

An optional relationship row can express the project's two sides, as in the
reference composition's “Local ownership → Shared reach” line. It is data with
two labels and two values, not arbitrary rich text. Reloved initially uses:

| Side | Label | Value |
| --- | --- | --- |
| From | Local ownership | Household storefronts |
| To | Shared reach | Network discovery |

WoTEx omits the row until exact public language is approved. Recetas connects
“Kitchen planning / Recipes & meal plans” to “Home automation / Timers &
displays”. The divider and arrow disappear when the data is absent, leaving no
empty space.

## Composition

The visual reference is a single ink canvas with a bounded composition centred
both horizontally and vertically. It uses the existing self-hosted Archivo
Variable font and the showcase's ink, paper, and muted colours. It does not use
the weekday accent: these pages should remain visually stable and monochrome.

At the 1440px reference width:

- the composition is at most 1240px wide and vertically centred in a
  `min-height: 100svh` shell;
- the upper area is a two-column grid, with the mark in the left third and the
  name, statement, support line, and optional relationship row in the right
  two thirds;
- the mark is optically centred in its column, not stretched to a common
  bounding-box edge;
- the project name is the only `h1` and uses the display weight;
- the statement sits below the name at a quieter size; the supporting line is
  muted and cannot exceed one comfortable reading line at the reference width;
- the relationship row has one hairline above and below, two equal textual
  sides, and a directional rule between them;
- the destination and link kind form a low final row aligned to opposite edges;
- the whole composition, including the final row, stays within the centred
  block. It is not pinned independently to the viewport corners.

Measurements must be expressed in container-query units and container
variants, never `vw` or viewport media queries, so a Storybook frame reproduces
production. At narrower containers the grid becomes one centred column: mark,
name, statement, support, relationship, and destination. The relationship row
stacks without rotating or shrinking its arrow into illegibility. The Recetas
variant uses the same mark-and-copy grid while omitting unapproved text and
relationship regions completely.

The root fits in one viewport at the 1440px reference and at common mobile
heights. Content growth may scroll; no text is clipped to force a one-screen
result. There is no entrance animation. Reduced-motion therefore requires no
alternate presentation.

## Application shape

The workspace package `apps/landing/` builds for one
SvelteKit Worker named `project-landings` with Cloudflare Static Assets. It
reuses the root style system and approved SVG marks through a `$site` alias, as
the waitlist package does, but it imports no waitlist components, brand types,
strings, D1 code, or administration code.

Implemented structure:

```text
apps/landing/
  src/worker.ts                   host gate before framework asset serving
  src/hooks.server.ts             exact-host resolution and response headers
  src/routes/+layout.ts           disable client rendering
  src/routes/+layout.server.ts    selected project data
  src/routes/+page.svelte         common composition
  src/routes/robots.txt/+server.ts
  src/routes/sitemap.xml/+server.ts
  src/lib/projects.ts             closed host-to-project map
  src/lib/marks.ts                approved mark components only
  src/lib/styles/landing.css      root style import and page-specific rules
  scripts/icons.ts               deterministic SVG and PNG generation
  scripts/verify-artifact.ts      client-script and collection-code boundary
  static/                         generated icons, social images, font licence
  tests/                          unit, Worker, component, and browser coverage
  wrangler.toml
  wrangler.build.toml             adapter output only, never deploy
```

`src/routes/+layout.ts` sets `csr = false`; the page has no browser bundle or hydration. Server
rendering remains enabled because the exact request host selects the project.
The asset binding serves only hashed styles, self-hosted fonts, icons, and social
images. The production configuration has no variables, secrets, or service
bindings.

The production entry wraps the adapter's generated `app.js`. Both
`assets.run_worker_first = true` and the outer gate are necessary: the adapter
otherwise serves matching static assets before SvelteKit hooks run. The gate
rejects unknown hosts, handles every `www` redirect, restricts methods to GET
and HEAD, and maps root icon URLs to the resolved project's private asset
directory. Direct `/projects/*`, `/_app/version.json`, and client-data requests
return a branded 404. Only hashed CSS and font assets use the one-year policy.

The build-only config directs the adapter to its output file and contains no
Custom Domains. Deploy only `wrangler.toml`, which invokes the host gate.
The `local` environment has an explicit `LANDING_LOCAL` flag and no routes;
production has no variables or secrets. Runtime types are generated by Wrangler.

## Routes and responses

Each apex serves:

- `/` — the landing page;
- `/robots.txt` — index policy matching that project's configuration;
- `/sitemap.xml` — the root URL only when indexing is enabled;
- `/favicon.svg`, `/favicon-48.png`, `/apple-touch-icon.png`, and the manifest;
- the social image named by the page metadata.

Unknown paths return the branded 404 response and must not fall back to `/`.
This leaves the path space honest and lets WoTEx add documentation later without
undoing a catch-all. Unknown hosts fail closed with 404. Local development
supports `<id>.localhost` under `wrangler dev --env local`. Bare loopback
hosts return 404. Stand-ins are rejected by the production Worker.

The `www` redirect uses 308 and preserves path and query. HTTPS is canonical.
The production Worker also redirects HTTP apex requests to HTTPS with 308,
so canonical transport does not depend on a separate zone setting. The local
environment retains HTTP for development.

## Metadata and agent access

Every indexed page has a self-referencing apex canonical URL, title,
description, Open Graph metadata, and a generated 1200 × 630 social image. The
`www` host never has separate metadata because it redirects. All three initial
projects now have approved descriptive copy and are included in their sitemap.

The root HTML contains the complete visible content, so an agent does not need
JavaScript. `robots.txt` and `sitemap.xml` are sufficient for the holding
release; do not add `llms.txt` containing only a restatement of the page. The
future WoTEx documentation application can add its own documentation-specific
agent surface.

External links use normal anchors and name the destination visibly. Open-source
links point only to public GitHub organisations or repositories. Venture copy
does not imply that private software, invitations, or a release are available.

## Security, privacy, and caching

The page makes no third-party requests. Use a CSP with `default-src 'none'` and
open only the self-hosted style, image, font, and manifest sources the build
requires. Send `frame-ancestors 'none'`, `base-uri 'none'`, content-type
protection, a strict referrer policy, and a restrictive permissions policy.

All six apex and `www` HTTPS hostnames were verified during the cutover, then
HSTS was enabled with `max-age=31536000`. Do not add `includeSubDomains` or
preload until every unrelated subdomain of each registrable domain has been
inventoried.

HTML and generated metadata use a one-hour maximum cache lifetime so copy can
change without a long stale window. Hashed assets are immutable for one year.
Icons and social images use one day. The page stores nothing in the browser and
has no consent banner because it has no non-essential storage or tracking.

The SvelteKit hook marks its internal response `no-store` to bypass the adapter's
independent Cache API layer. The outer Worker then applies the public response
policy. This prevents cached HTML from referencing a removed stylesheet after
a rebuild; errors remain `no-store`. The build also excludes the generated
server `app.js` from static asset uploads.

## Cloudflare and DNS

The Worker configuration declares six Custom Domains and disables both
`workers.dev` and versioned preview URLs:

```toml
name = "project-landings"
workers_dev = false
preview_urls = false

[[routes]]
pattern = "wotex.io"
custom_domain = true

[[routes]]
pattern = "www.wotex.io"
custom_domain = true

[[routes]]
pattern = "reloved.eco"
custom_domain = true

[[routes]]
pattern = "www.reloved.eco"
custom_domain = true

[[routes]]
pattern = "recetas.co.com"
custom_domain = true

[[routes]]
pattern = "www.recetas.co.com"
custom_domain = true
```

Custom Domains require active Cloudflare zones and cannot attach over conflicting
web records. The implementation must use the project's pinned Wrangler version
and validate the final configuration against its installed schema.
[Cloudflare Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)

The post-deployment DNS baseline checked on 8 September 2026 is:

- All three zones are active and delegated to `brenda.ns.cloudflare.com` and
  `chad.ns.cloudflare.com`. The Recetas parent delegation was also verified.
- Each apex and `www` has a Worker-managed, proxied `AAAA` record with
  `100::` as its placeholder. The six Custom Domains belong only to
  `project-landings`; certificates are provisioned.
- Reloved and Recetas retain their Hostinger MX, SPF, three DKIM CNAMEs,
  DMARC, autoconfig, autodiscover, and verification records, all DNS-only.
- WoTEx now uses Hostinger, not the earlier Namecheap forwarding baseline.
  The three missing Hostinger DKIM CNAMEs and `_dmarc` TXT
  `v=DMARC1; p=none` were restored before deployment. MX and SPF were unchanged.
- Every pre-deployment DNS record in these three zones was compared by ID and
  value after deployment; only the six intended web records were added.
- Cloudflare DNSSEC is disabled on all three zones. Enabling it and publishing
  each assigned DS record at Namecheap remains a coordinated external task.

Mail DNS resolution has been checked, not mailbox delivery. Local recursive
DNS caches retained some old answers during verification; authoritative DNS
and live HTTPS were tested separately rather than treating a cached failure
as a failed Worker deployment.

## Reloved waitlist migration

Reloved must have exactly one owner at the edge. Before deploying either public
Worker:

1. Remove `reloved.eco` and `www.reloved.eco` from
   `apps/waitlist/wrangler.toml`.
2. Remove Reloved from the waitlist brand id, brand map, mark map, generated
   assets, tests, local index, privacy copy, and “five waitlists” documentation.
3. Change the showcase link label from “Join waitlist” to a neutral visit label
   while keeping `https://reloved.eco` as the approved destination.
4. Confirm the landing Worker is the only config declaring the Reloved Custom
   Domains.
5. Deploy the landing Worker before, or in the same controlled release as, the
   reduced waitlist Worker so Reloved never exposes a collection form.

Immediately before the 8 September deployment, a read-only production
`waitlist` D1 query returned zero Reloved subscriptions and zero withdrawal
requests, and no migrations were pending. No data was changed. All five steps
are complete for the landing release: the landing Worker is deployed and the
reduced waitlist Workers remain undeployed, pending their separate Access,
secrets, and operational gates. Any future Reloved data requires explicit
consent and retention handling, not deletion during configuration cleanup.

## Verification

Tests must cover:

- exact resolution of all three apex hosts and local stand-ins;
- 308 redirects for all three `www` hosts with path and query preservation;
- 404 for unknown hosts and paths;
- full server-rendered content with no client script;
- conditional removal of the mark, statement, relationship row, and link;
- canonical, robots, sitemap, manifest, icon, and social-image output per host;
- no waitlist language, form, D1 binding, remote request, tracking, or release
  claim in the source or built artifact;
- keyboard focus, semantic headings, text resizing, mobile overflow, colour
  contrast, and automated accessibility checks;
- a 1440px screenshot measured against the reference for WoTEx, Reloved, and
  the approved-toast Recetas variant, plus mobile Chromium screenshots;
- a Wrangler dry run proving the production bundle and six intended Custom
  Domains without publishing it.

After deployment, verify apex and `www` over both HTTP and HTTPS, certificates,
redirect preservation, response headers, metadata, asset caching, and external
mail resolution. A successful dry run cannot establish DNS, certificate, or
runtime correctness.

### Local visual audit — 8 September 2026

`pnpm test:all` passed under Node 24.20.0: formatting, all three package type
checks, and 243 tests. The existing desktop-only alignment assertion is skipped
in the mobile test project. The production Wrangler 4.129.0 dry run passed
with a 382.55 KiB bundle (89.75 KiB gzip), ASSETS as its only binding, and the
six declared Custom Domains; nothing was published.

The production-build captures are in
`/Users/roam/Desktop/project-landings-audit-2026-09-08/`, with `index.html`,
`measurements.json`, and separate PNGs for all three projects at 1440×900 and
414×896. The same directory includes the Recetas showcase entry and footer at
both widths. Reproduce the captures with `apps/landing/scripts/audit.ts`.

All six pages returned 200, loaded only their own stylesheet and bundled
Archivo font, and contained zero browser scripts and forms. Automated axe
checks reported no violations. Each composition was centred to within one
pixel; none exceeded the viewport width or height at those sizes.

At 1440px, the shared frame is 1240px wide with its left edge at x=100; the copy
column starts at x=516. The 107px title and Reloved's statement, supporting line,
rules, and destination were compared with the supplied 1280px composition at
the corresponding scale. WoTEx's longer statement occupies two lines; its
supporting description remains one line. Recetas uses the same complete copy,
relationship, and destination rhythm as the other project variants.
The footer's eight venture marks have approximately 42.5px SVG boxes, down
from 49.3px, with their previous order preserved.

The corrected local Recetas repository card uses the existing social-card
renderer and its exact 1280×640 template. It is saved at
`/Users/roam/Desktop/github-social-previews/repositories/futhr/recetas.png`, with
editable source HTML, a manifest entry, and the supplied toast mark snapshot.
This local artifact does not publish the private repository or change its
visibility.

### Live release audit — 8 September 2026

Production Worker version `b65a6b0a-0b07-4551-b7b6-5ea27b4feeb1` serves the
six declared Custom Domains. Its final dry run was 382.72 KiB (89.81 KiB gzip),
with ASSETS only. `workers.dev` and versioned preview URLs were confirmed
disabled through the account API. The landing tests passed again after adding
the HTTP upgrade and host-only HSTS policy.

Live screenshots, geometry, network requests, and axe results are in
`/Users/roam/Desktop/project-landings-live-audit-2026-09-08/`. All six
desktop/mobile views returned 200, made only same-origin requests, had no
scripts or forms, and had no automated accessibility violations or viewport
overflow. The 1440px frames remained 1240px wide at x=100 and centred to within
one pixel. The deployed Reloved, WoTEx, and Recetas compositions were visually
compared with the approved reference and local captures.

The default-resolver capture encountered a stale Recetas DNS answer. The
completed audit used `--live --authoritative-dns`, which pins the three apexes
to their current authoritative addresses inside Chromium only. Certificate
verification remained enabled. This evidence establishes the live origin,
TLS, and layout; it does not claim worldwide cache propagation is complete.

Cloudflare prepends managed robots directives to each zone. Recetas now has
approved descriptive copy and the application also emits `Allow: /`, so the
previous conflict between the managed `Allow: /` and application `Disallow: /`
no longer exists. Its root metadata, response headers, sitemap, and robots file
must all remain aligned with the indexed policy.

## Acceptance criteria

The feature is complete when:

- each apex opens a vertically and horizontally centred, project-specific page
  at desktop and mobile sizes;
- Reloved matches the supplied composition and language without a form or
  invitation;
- WoTEx clearly identifies the open-source project and links to its public
  GitHub organisation while reserving paths for later documentation;
- Recetas uses the approved toast mark, kitchen-automation positioning, and
  relationship row without exposing or linking its private repository;
- every `www` hostname redirects to its matching apex;
- no hostname belongs to both the landing and waitlist Workers;
- mail continues to resolve after both DNS cutovers;
- the built application contains no personal-data collection path or runtime
  secret; and
- the 1440px screenshots have been compared to the reference for alignment,
  cap-height, spacing, and line breaks.
