# Cloudflare deployment

Checked against the repository and Cloudflare account on 8 September 2026.
Configuration in Git records deployment intent; registrar settings, mail DNS,
Access identities, secret values, billing plans, and deployed versions still
need an account-side check before a release.

## Current configuration

| Deployable | Build command | Artifact | Config | Hosting model |
| --- | --- | --- | --- | --- |
| Showcase | `pnpm build` | `build/` | `wrangler.toml` | Pages (`pages_build_output_dir`) |
| Domain redirects | bundled by Wrangler | Worker code | `wrangler.redirects.jsonc` | Module Worker, name `bohwalli-redirect` |
| Storybook | `pnpm storybook:build` | `storybook-static/` | `wrangler.storybook.toml` | Workers static assets, name `futhr-ui` |
| Public waitlists | `pnpm build:waitlist` | `apps/waitlist/.svelte-kit/cloudflare/` | `apps/waitlist/wrangler.toml` | SvelteKit Worker, name `waitlist-web` |
| Project landings | `pnpm build:landing` | `apps/landing/.svelte-kit/cloudflare/` | `apps/landing/wrangler.toml` | SvelteKit Worker with a host gate, name `project-landings` |
| List administration | bundled by Wrangler | Worker code | `apps/waitlist/wrangler.admin.toml` | Module Worker, name `waitlist-admin` |

The showcase and Storybook serve static files. The waitlist public Worker
renders pages and accepts forms; its asset binding serves hashed files and
brand icons. The admin Worker lists records and resolves withdrawal requests. Neither sends email.

The production waitlist configs bind the EU-jurisdiction `waitlist` D1 database.
The local development environment retains a non-production placeholder ID because
Wrangler uses a local database there. The waitlist configs declare eight public Custom
Domains and `lists.futhr.io`, but that does not establish that those domains are
provisioned. The Storybook config declares `ui.futhr.io` as a Custom Domain.
The landing Worker declares six separate Custom Domains: apex and `www` for
`wotex.io`, `reloved.eco`, and `recetas.co.com`. It collects nothing, binds only
static assets, and serves no client JavaScript. Reloved no longer belongs to
the waitlist configuration. See [project-landings.md](project-landings.md).

## Live account status

| Resource | Latest verified status |
| --- | --- |
| Showcase | Production Pages deployment `2515bacf` is live with Recetas, the eight-mark footer, and “Visit Reloved” |
| Legacy domains | Bohwalli and Entvue apex and `www` hostnames permanently redirect to the equivalent path on `futhr.io` |
| `www.futhr.io` | The redirect Worker returns `301` to the equivalent path and query on `futhr.io`; requests no longer reach the previous Netlify origin |
| Storybook | Updated Worker `futhr-ui` is live on `ui.futhr.io`; noindex is verified, and both `workers.dev` and versioned previews are disabled |
| D1 | Database `waitlist` exists with EU jurisdiction and both committed migrations applied |
| Workers plan | Last checked 7 September: Workers Free active, no payment method attached; recheck before release |
| Waitlist Workers | `waitlist-web` and `waitlist-admin` are not deployed |
| Venture zones | Account read on 8 September: `rivure.com`, `diggymon.com`, `refpath.io`, `orvane.io`, and `reloved.eco` are active Cloudflare zones |
| Landing Worker | `project-landings` is deployed with all six intended Custom Domains; HTTPS, redirects, and live desktop/mobile layouts verified |
| WoTEx and Recetas DNS | Both zones are active and delegated to Cloudflare; the landing deploy added apex/`www` web records without changing mail DNS |
| Reloved data | Read-only production D1 query on 8 September: zero subscriptions and zero withdrawal requests; no rows changed |
| Git deployment | The `futhr` Pages project is Direct Upload; deployments are manual and no deploy CI is configured |
| Access | API reports `access.api.error.not_enabled`; no admin hostname or collection Worker has been exposed |
| Other pending zone | `orvane.ai` remains pending and is not declared in either application; its mail-provider discrepancy needs a separate decision |

The authenticated Wrangler session can deploy Pages, Workers, and D1, but its
OAuth grant cannot create zones, edit DNS, inspect billing, or administer
Access. The connected Cloudflare MCP was used for read-only zone, Worker, and
Custom Domain inventory on 8 September. DNS updates and Bulk Redirect list
creation were attempted through MCP and rejected with API error 10000; neither
attempt changed state. Wrangler successfully deployed the landing, redirect,
Storybook, and Pages artifacts. No permissions, credentials, billing plan, or
repository visibility were changed.

The restored WoTEx mail records are three DNS-only CNAMEs named
`hostingermail-{a,b,c}._domainkey`, pointing to the matching
`hostingermail-{a,b,c}.dkim.mail.hostinger.com` targets (TTL 1800), plus
`_dmarc` TXT `v=DMARC1; p=none` (TTL 3600). They were copied through the
authenticated dashboard with explicit approval after MCP rejected writes,
and verified on both authoritative nameservers. Existing MX/SPF were preserved.

## Authentication

Cloudflare MCP connections are machine-local and repository-scoped in
`.codex/config.toml`, which is ignored by Git. The five servers are `cloudflare`,
`cloudflare-docs`, `cloudflare-bindings`, `cloudflare-builds`, and
`cloudflare-observability`. Do not add them to the global Codex configuration.
Existing MCP authentication stays in Codex's authentication storage, not in
the repository. Codex requires an explicit trust entry for this repository in
the global config, but no global Cloudflare MCP server entries. Open a new
session in this repo and use `/mcp` to check the loaded connections.

Use the pinned Wrangler through `pnpm exec wrangler`, or
`pnpm --filter waitlist exec wrangler` for the waitlist package. Interactive
workstations can use `wrangler login`; automation uses
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in its environment.
Do not put tokens in commands saved to Git or in documentation examples.
[Wrangler authentication](https://developers.cloudflare.com/workers/wrangler/system-environment-variables/)

Local state and secret files are ignored. Waitlist development runs the
`local` environment and reads `apps/waitlist/.dev.vars.local`; copy the
committed `.dev.vars.example` to that name. The example contains local test
values. Production secrets are set separately for each Worker.
[Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/)

## Provisioning the waitlists

The package [operating guide](../../apps/waitlist/README.md) lists secrets and
API routes. Provisioning requires these steps:

1. The EU-jurisdiction D1 database has been created, its identifier is set in
   both production waitlist configs, and both committed migrations are applied.
   Check for future pending migrations with `pnpm --filter waitlist exec
   wrangler d1 migrations list waitlist --remote`. EU jurisdiction controls
   database storage location; Worker execution is a separate consideration.
   [D1 location](https://developers.cloudflare.com/d1/configuration/data-location/)
2. Create an Access application for `lists.futhr.io` before attaching that
   hostname. Configure the human identity policy and MFA requirement. Email
   one-time PIN alone does not establish two-factor authentication. Give each
   automation a service token and a Service Auth policy. Set the team domain,
   application audience, and identity-to-brand grants on the admin Worker. Keep
   reviewer identities in `ADMIN_REVIEWER_BRAND_GRANTS`, outside the operator
   map `ADMIN_BRAND_GRANTS`.
   [Access applications](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/),
   [service tokens](https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/)
3. Generate the encryption and digest keys. Set each Worker's required
   secrets, including the admin copy of every encryption key version still
   used by stored rows. The digest key must remain stable; changing it without
   migrating existing digests breaks duplicate detection.
4. Build and run all checks. Inspect the bundles with the dry-run commands
   below. Use a separate database and configuration for a staging deployment;
   no staging environment is committed.
5. Deploy using the production configs only after DNS, Access, secret values,
   and the collection notice are ready. `wrangler deploy` attaches the Custom
   Domains declared in those configs as part of the deployment.

### DNS and mail

Custom Domains require an active Cloudflare zone. The venture domains are
registered at Namecheap and use Hostinger for mail. Export the existing DNS
records before changing nameservers. Compare the Cloudflare import with the
current Hostinger account, including MX, SPF, DKIM, DMARC, and verification
records; account values take precedence over examples in a guide.

Keep mail-related records unproxied. Resolve conflicting web records before
attaching Custom Domains; an existing CNAME on the hostname prevents creation.
Coordinate removal of old web records with cutover to avoid downtime. Follow
the registrar's DNSSEC procedure when changing nameservers, then verify mail
and web resolution after activation.
[Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/),
[Namecheap nameservers](https://www.namecheap.com/support/knowledgebase/article.aspx/767/10/how-to-change-dns-for-a-domain/),
[Hostinger mail records](https://www.hostinger.com/support/8671319-set-up-a-domain-for-hostinger-email-manually/)

The public DNS baseline checked on 7 September 2026 is:

- Every venture has `mx1.hostinger.com` priority 5 and
  `mx2.hostinger.com` priority 10, apex SPF
  `v=spf1 include:_spf.mail.hostinger.com ~all`, and the three
  `hostingermail-{a,b,c}._domainkey` CNAMEs to the matching
  `*.dkim.mail.hostinger.com` targets.
- Rivure, Diggymon, Refpath, and Reloved use `_dmarc` value
  `v=DMARC1; p=none`. Orvane uses
  `v=DMARC1; p=none; rua=mailto:dmarc@orvane.io`.
- Apex verification TXT values are `f232aadb745c3cb21b1c3ddd77dbf34b`
  for Rivure, `973504e814120e5864a5dc380e809398` for Diggymon,
  `a45887666e3ecb5cc9aaf12ba9689435` for Refpath, and
  `8bb2b117678892e2e724be9c3a9a8bd0` for Reloved. Orvane has no
  separate verification TXT record.
- None of the five domains currently publishes a DS record. Still check the
  registrar before cutover because a recently changed record may not appear in
  every resolver cache immediately.

### Remaining external cutover

1. The redirect Worker already handles `www.futhr.io`, `bohwalli.se`,
   `www.bohwalli.se`, `entvue.com`, and `www.entvue.com`. Their underlying
   Netlify DNS records remain stale. With DNS-edit access, replace only those
   five web records with proxied originless records, such as `A 192.0.2.1`.
   Keep all mail records. MCP rejected the attempted `www.futhr.io` update;
   the existing redirect remains operational and preserves path/query.
   [Pages www redirect](https://developers.cloudflare.com/pages/how-to/www-redirect/)
2. `futhr.pages.dev` still serves the default Pages copy. Do not delete the
   Pages project or its apex CNAME: it hosts `futhr.io`. The documented fix is
   a Bulk Redirect from `futhr.pages.dev` to `https://futhr.io`, status 301,
   with query preservation, subpath matching, path-suffix preservation, and
   subdomains enabled. MCP rejected list creation before any object was
   created. This requires Account Filter Lists Edit and Bulk URL Redirects
   Edit; a domain-based rule in Pages `_redirects` is not supported.
   [Pages canonical-domain redirect](https://developers.cloudflare.com/pages/how-to/redirect-to-custom-domain/),
   [Bulk Redirect API](https://developers.cloudflare.com/rules/url-forwarding/bulk-redirects/create-api/)
3. All seven application zones are active: the four waitlist zones plus WoTEx,
   Reloved, and Recetas. No further nameserver change is needed for them.
   `orvane.ai` is a separate pending zone, outside the current application
   configs; reconcile its Namecheap forwarding versus staged Hostinger mail
   records before any cutover. Do not substitute it for `orvane.io`.
4. DNSSEC is still disabled on the three landing zones. Enable it only as a
   coordinated task with publishing each assigned DS record at Namecheap and
   verifying the resulting chain. No DNSSEC or registrar changes were made.
   [Cloudflare DNSSEC](https://developers.cloudflare.com/dns/dnssec/)
5. Access is not enabled. Set up Zero Trust and independent MFA, then create
   a self-hosted application for `lists.futhr.io` restricted to the exact
   approved operator/reviewer identities. Do not use “Everyone” or a
   login-method-only rule. Add Service Auth only for an explicitly approved
   automation identity with its own service token.
   [Access application](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/),
   [independent MFA](https://developers.cloudflare.com/cloudflare-one/access-controls/access-settings/independent-mfa/)
6. Record the Access team domain and application audience. Generate and store
   the waitlist encryption and digest keys in the team's secret manager, then
   set each Worker's runtime secrets. Both Workers need the same active keys.
   Fill operator and reviewer grants with exact identities and brand IDs.
   Do not invent grants or expose the admin hostname before these are ready.
7. Recheck the Workers Free/D1 Free plan, monitored contact mailbox, and
   retention operations. Deploy `waitlist-admin` only after Access and secrets
   are ready, then `waitlist-web`. The four waitlist apexes/`www` have no web
   records yet; their deploy will attach eight Custom Domains. Recheck for
   conflicts immediately before that deploy. Run every release check and the
   receipt-to-resolution test before opening collection. No test subscribers
   were inserted into production during this audit.
8. Cloudflare prepends managed robots rules on the landing zones. For Recetas,
   the injected `Allow: /` conflicts with its own `Disallow: /`. Its HTML and
   response header retain `noindex, nofollow`, and the sitemap is empty.
   Disable only `is_robots_txt_managed` for the Recetas zone and verify the
   final response. MCP rejected this update with error 10000; no bot-security
   settings were changed. Retain the existing WoTEx/Reloved crawler policies.

## Cost boundary

The waitlists must use the Workers Free account plan and D1 Free for the intended
absence of usage overages. Confirm this in the account before deployment: the
Workers plan is separate from the zone's Free/Pro/Business plan. Do not enable
Workers Paid, paid AI, an email delivery API, or extra backup services as part of
this deployment. An account upgrade changes this boundary for the resources it
covers and needs a new cost review.
[Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)

Under the current Free-plan documentation, Workers returns an error after its
daily request allowance and D1 stops queries after its daily database quotas.
Use fail-closed routing where applicable. This can cause temporary unavailability;
it does not guarantee service during abuse. Per-client throttling and the
1,000-request inbox ceiling limit work but do not cap a bill on a Paid plan.
There is no automatic upgrade or paid fallback configured by this application.
[Workers limits](https://developers.cloudflare.com/workers/platform/limits/),
[D1 quota behaviour](https://developers.cloudflare.com/d1/reference/faq/)

The withdrawal action sends no email and invokes no AI. Optional AI review is
an operator-initiated API read, limited to 50 metadata records per page. An
external model can charge for that review; no model credentials or calls are
configured here. Existing registrar and mailbox charges are outside this
Workers/D1 usage boundary.

## Build and deploy commands

Run from the repository root. These commands publish changes:

```sh
pnpm build
pnpm exec wrangler pages deploy build --project-name futhr

pnpm redirects:deploy
pnpm storybook:deploy

pnpm build:waitlist
pnpm --filter waitlist exec wrangler deploy --env=""
pnpm --filter waitlist exec wrangler deploy --config wrangler.admin.toml

pnpm build:landing
pnpm --filter landing exec wrangler deploy --env=""
```

The site uses the Pages command while `wrangler.toml` contains
`pages_build_output_dir`. Verify the Pages project name in the account before
publishing. Do not use the proposed Workers migration command with that config.

These commands only bundle and validate the Worker deployment packages:

```sh
pnpm exec wrangler deploy --config wrangler.redirects.jsonc --dry-run
pnpm exec wrangler deploy --config wrangler.storybook.toml --dry-run
pnpm --filter waitlist exec wrangler deploy --env="" --dry-run
pnpm --filter waitlist exec wrangler deploy --config wrangler.admin.toml --dry-run
pnpm --filter landing exec wrangler deploy --env="" --dry-run
```

CI runs tests and these five dry runs. It does not deploy. Any future deploy
job must wait for `verify`, `waitlist`, and `landing`, use the relevant package's
config, and receive a token scoped to the resources it changes.

Local verification on 8 September passed `pnpm test:all` under Node 24.20.0
(one intentional mobile skip). The affected root unit, landing, and waitlist
suites passed again after redirect and header hardening. All five Worker dry
runs passed. The final landing bundle is 382.72 KiB, with ASSETS only.
Separate [live audit evidence](project-landings.md#live-release-audit--8-september-2026)
records the deployed pages, TLS, desktop/mobile geometry, and the authoritative
DNS override needed while local resolver caches retained old answers.

Deployed versions on 8 September:

| Surface | Deployment/version |
| --- | --- |
| Project landings | `b65a6b0a-0b07-4551-b7b6-5ea27b4feeb1` |
| Legacy redirects | `d244ec01-2bc3-4ac1-b832-1f370bbd48e8` |
| Storybook | `4f2c31a5-6508-4cd0-8780-cff2125e07d6` |
| Showcase Pages | `2515bacf` production deployment |

The redirect fix keeps paths beginning `//` on `futhr.io` instead of treating
them as a new hostname. Both default Worker domains and versioned preview
URLs are disabled for the three deployed Workers and were checked via API.

The existing `futhr` Pages project uses Direct Upload and Cloudflare does not
allow converting a Direct Upload project to Git integration. Automatic
showcase deployments therefore require a CI job that runs the Pages deploy
command above, or a separately tested Pages project followed by a domain
cutover. Do not repeat the generic Workers import that failed at the workspace
root. For Workers Builds, connect each existing Worker separately and use an
explicit root and deploy command: `/` plus the Storybook config for `futhr-ui`,
and `/apps/waitlist` plus the relevant public or admin config for each waitlist
Worker. The Worker name must match the config's `name`.
[Pages Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/),
[Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)

## Response headers

`static/_headers` covers the showcase. It sets content-type protection,
referrer policy, frame policy, permissions policy, and asset caching. The
current file does not set CSP or HSTS. Storybook has its own `_headers` and
`robots.txt` excluding it from indexing.

For the waitlists, `kit.csp` generates the HTML nonce policy.
`src/hooks.server.ts` applies headers to rendered pages, documents, icons,
redirects, and errors. `apps/waitlist/_headers` applies at the static asset
layer; its icon rule uses one named placeholder and one wildcard. The adapter
adds immutable caching for `/_app/immutable/*`.
[Static asset headers](https://developers.cloudflare.com/workers/static-assets/headers/),
[SvelteKit headers](https://svelte.dev/docs/kit/adapter-cloudflare#Headers-and-redirects)

Keep HTML fresh across releases. Icons are cached for one day; hashed assets
for one year. The admin API sends `no-store`. Waitlist HTTPS responses include
host-only HSTS, without `includeSubDomains` or preload. This avoids making
transport promises for unrelated or mail subdomains. Invocation logs are
disabled, query strings are redacted, and logs/traces are sampled at one percent.

For landings, the outer Worker applies the same closed CSP to HTML, metadata,
redirects, errors, icons, and hashed assets. There are no client scripts or
inline styles. HTML and metadata cache for one hour; icons and social images
for one day; hashed CSS and fonts for one year. Host-only HSTS is enabled after
verification of all six HTTPS hostnames. The Worker upgrades HTTP even without
a zone redirect. No preload or `includeSubDomains` is configured. Invocation logging is disabled; Worker
observability and traces are sampled at one percent.
The SvelteKit hook bypasses the adapter's internal Cache API with `no-store`;
the outer gate alone sets the public page cache policy, avoiding stale HTML
after a build changes the stylesheet hash. Server `app.js` is excluded from
the asset upload.

Cloudflare adds Network Error Logging (`NEL`/`Report-To`) headers at the edge.
These are separate from application analytics: no analytics script, cookie,
or third-party page request was observed in the landing audit. This release
does not claim that provider-level diagnostic reporting is disabled.

A future showcase CSP must account for the weekday script, hydration scripts,
JSON-LD, the inlined stylesheet, and animation styles. Derive hashes from the
actual build and test the enforced policy in a browser. A hash for only the
weekday script is insufficient.

## Optional Pages-to-Workers migration

This migration is not implemented. Use Cloudflare's
[migration guide](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/)
and plan a domain cutover before changing the live Pages project.

The proposed Worker config uses `assets.directory = "./build"` and
`assets.not_found_handling = "404-page"` instead of `pages_build_output_dir`.
Test the built 404 page, agent documents, caching, and offline behavior on a
separate hostname first. Attach `futhr.io` only when the old domain binding can
be released. Keep the Pages project available for rollback until the new
hosting path has been verified.

## Release checks

Verify actual URLs after deployment:

- The showcase returns its page, metadata, and generated agent documents.
  An unknown path returns 404. Test a hashed asset URL extracted from the HTML,
  rather than requesting the asset directory itself.
- Storybook returns `X-Robots-Tag: noindex, nofollow` and its disallowing robots
  file. Check its configured custom domain and preview URL behavior.
- Each waitlist venture serves its own page, manifest, icons, privacy notice, and withdrawal form.
  `www` redirects to the matching apex with path and query intact.
- Each landing apex renders its own script-free page, robots policy, sitemap,
  manifest, icons, and social image. Every `www` path redirects to the HTTPS
  apex; unknown hosts fail closed even for static assets. Confirm mail after
  the WoTEx and Recetas nameserver cutovers. Deploy the landing Worker before
  enabling the reduced waitlist Worker.
- Native and enhanced form submissions show the same result. Invalid input
  returns 400, a foreign origin 403, and an exhausted rate limit 429.
- Access challenges an unauthenticated admin request. A valid identity can
  access only its granted brands. A reviewer can read inbox metadata but cannot
  read addresses, delete subscriptions, or resolve requests. Test operator
  resolution, repeat requests, and a failure of the audit insert.

Complete the [privacy operating procedure](../legal/waitlist-operations.md)
setup and run its receipt-to-resolution test before opening collection.

Dry runs cannot verify DNS, Access policies, secret values, or production D1.
Monitor actual request and database usage against the account's limits; this
repository does not establish that a given traffic level fits the free plan.
