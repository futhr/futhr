# Waitlist Workers

The venture waitlists: one public Worker that serves five exact hostnames and
collects addresses, and one private Worker that reads them. The reasoning is in
[docs/architecture/waitlist-platform.md](../../docs/architecture/waitlist-platform.md).
This file is the operating guide.

Joining is the whole flow: a visitor enters an address and sees a confirmation
on the page. Nothing is emailed. Each platform launches with its own list
handling; until then the list is read through the admin API. The page is one
centred column on ink: the mark, the brand name, its closing line, and the form
under a "Get notified" heading, with a Privacy link as the only footer. The form
is a SvelteKit form action, so it works without JavaScript and stays on the page
with it. Bots are kept out by a hidden field they fill and people never see, plus
the rate limit; there is no third-party script on the page.

| Worker | Config | Hostnames | Capability |
| --- | --- | --- | --- |
| `waitlist-web` | `wrangler.toml` | `rivure.com`, `diggymon.com`, `refpath.io`, `reloved.eco`, `orvane.io` | Branded page, privacy notice, join |
| `waitlist-admin` | `wrangler.admin.toml` | `lists.futhr.io` behind Cloudflare Access | List, delete |

The brand is derived from the request hostname in `src/brands/host.ts`. A `www`
hostname gets a permanent redirect to its apex; any other hostname gets a
temporary redirect to `https://futhr.io/`. Nothing here is served from `futhr.io`.

## Layout

```
src/hooks.ts          reroutes every path on a venture hostname into that brand's route tree
src/hooks.server.ts   resolves the brand from the hostname, redirects unknown hosts, sets headers
src/routes/           SvelteKit pages and endpoints under brands/[brand]/
src/params/           route matchers: brand id, generated document names, icon files
src/lib/brands/       closed brand map, copy, controller, generated documents, icon composition
src/lib/components/   Svelte 5 page shell, landing, join form, privacy, notice pages
src/lib/server/       the join action, crypto, store, headers; admin/ holds the private API and Access JWT
src/lib/marks.ts      the showcase mark component per brand
src/admin-worker.ts   private API entry
migrations/           sequential D1 migrations
static/brands/        generated icons and social images, committed
scripts/icons.ts      regenerates the icons with Chromium
tests/                unit (Node), workers (workerd against the built Worker), e2e (Playwright against wrangler dev)
```

The public Worker is SvelteKit on `@sveltejs/adapter-cloudflare`, rendered per
request; `pnpm build` writes it and its hashed assets to `.svelte-kit/cloudflare/`.
The style system is the showcase's `src/lib/styles/site.css`, imported unchanged;
the marks are the showcase's logo components. Brand identity is the mark, the
name, the closing line, and the metadata. There are no per-brand colours and no
links to futhr.io or the other ventures on a brand page.

## Commands

Run from the repository root with `pnpm --filter waitlist <script>`, or from
this directory.

| Script | Does |
| --- | --- |
| `build` | SvelteKit build: the Worker and its hashed assets in `.svelte-kit/cloudflare` |
| `dev` | Build, apply migrations locally, start `wrangler dev` on :8787 |
| `check` | Generate runtime types, svelte-check, TypeScript for the Workers |
| `icons` | Regenerate `static/brands/*/icons` from the mark components with Chromium |
| `test:unit` | Brand map, documents, icons, crypto, email syntax, headers, Access |
| `test:workers` | Both Workers in workerd with D1 and rate limiting, the public one as built |
| `test:e2e` | Playwright against `wrangler dev` on the five hostnames |

## Viewing it locally

`pnpm --filter waitlist dev` builds, applies the migrations to a local D1, and
starts `wrangler dev` on `http://127.0.0.1:8787/` in the `local` Wrangler
environment, which has the same bindings but no Custom Domains. It reads
`.dev.vars.local`; copy `.dev.vars.example` first.

Open `http://127.0.0.1:8787/`. Each brand answers on its own hostname, so that
page lists the local stand-ins: `http://rivure.localhost:8787/`,
`http://diggymon.localhost:8787/`, `http://refpath.localhost:8787/`,
`http://reloved.localhost:8787/`, and `http://orvane.localhost:8787/`, each with
`/privacy`. Chrome and Firefox resolve every `.localhost` name to this machine
without configuration; Safari does not, so there add
`127.0.0.1 rivure.com diggymon.com refpath.io reloved.eco orvane.io` to
`/etc/hosts` for the session and open the real hostnames on port 8787. The
showcase on `:5173` has no `/waitlist` route. A join lands in the local D1 and
shows the on-page confirmation.

## Data

One D1 database, created with `wrangler d1 create waitlist --jurisdiction=eu`.
Paste the id into both Wrangler files and apply migrations with
`wrangler d1 migrations apply waitlist --remote`.

One row per brand and address: the address as AES-256-GCM ciphertext under a
versioned key, a keyed HMAC of brand and canonical address for duplicate
detection, the consent version, and the time of joining. Nothing about an
address is logged. There is no retention job; the notice commits to a review
every twelve months, and erasure is the admin API's `DELETE`.

## Secrets

Set with `wrangler secret put <NAME>` for each Worker. Generate keys with
`node -e "console.log(crypto.randomBytes(32).toString('base64'))"`.

| Name | Worker | Purpose |
| --- | --- | --- |
| `EMAIL_KEY_VERSION`, `EMAIL_KEY_<VERSION>` | both | AES-256 key for addresses, versioned |
| `EMAIL_DIGEST_KEY` | both | HMAC key for duplicate detection |
| `ACCESS_TEAM_DOMAIN`, `ACCESS_AUDIENCE` | admin | Access JWT issuer and application audience |
| `ADMIN_BRAND_GRANTS` | admin | JSON: identity to brand ids or `["*"]` |

To rotate the address key, add `EMAIL_KEY_V2` and switch `EMAIL_KEY_VERSION`
to `v2` on both Workers. Each row records the version it was written under, so
keep `EMAIL_KEY_V1` defined until every row that names it has been re-encrypted
or deleted.

## DNS

The domains are registered at Namecheap and mailboxes live at Hostinger. Custom
Domains only work on zones that Cloudflare serves, so each domain moves its DNS
to Cloudflare while keeping Hostinger for mail. Nothing here sends mail, so no
sending domain is onboarded. The record values and the Cloudflare side of every
step are in [docs/architecture/cloudflare.md](../../docs/architecture/cloudflare.md):

1. Add the domain as a zone in the Cloudflare account and let the scan import
   the existing records. Compare the result with the DNS zone in hPanel and add
   anything missing by hand: the MX records, the SPF `TXT`, the DKIM record,
   and DMARC. Mail is unaffected as long as these match before the switch.
2. Remove any `A`, `AAAA`, or `CNAME` record for the apex and `www` that points
   at parking or web hosting. Custom Domains refuse a hostname that already has
   a `CNAME`; removing the rest keeps the first deploy from stopping on a conflict.
3. At Namecheap, set the domain's nameservers to the two Cloudflare assigns.
   Wait for the zone to become active, then deploy.

## Deploying

1. Create the D1 database.
2. Set the secrets above on both Workers.
3. `pnpm --filter waitlist build`, then `wrangler deploy` for each config.
   Both files set `workers_dev = false` and `preview_urls = false`.
4. Put `lists.futhr.io` behind a Cloudflare Access application with MFA for
   humans and a service token per automation, and copy its AUD tag into
   `ACCESS_AUDIENCE`.
5. Attach the ten Custom Domains, apex and `www` for each venture, only after
   the verification checklist in `docs/architecture/cloudflare.md` passes. The
   Worker redirects `www` to the apex itself; no redirect rules are needed.

## Admin API

All routes require `Cf-Access-Jwt-Assertion` and a grant for the brand.

```
GET    /v1/brands
GET    /v1/brands/:brand/subscriptions?cursor=&limit=
DELETE /v1/brands/:brand/subscriptions/:id
```

The list returns addresses, decrypted, in join order, with a cursor for the next
page. Every list read and every delete is written to `audit_log`.
