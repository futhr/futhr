# Cloudflare deployment

Checked against the repository and Cloudflare account on 7 September 2026.
Configuration in Git records deployment intent; registrar settings, mail DNS,
Access identities, secret values, billing plans, and deployed versions still
need an account-side check before a release.

## Current configuration

| Deployable | Build command | Artifact | Config | Hosting model |
| --- | --- | --- | --- | --- |
| Showcase | `pnpm build` | `build/` | `wrangler.toml` | Pages (`pages_build_output_dir`) |
| Storybook | `pnpm storybook:build` | `storybook-static/` | `wrangler.storybook.toml` | Workers static assets, name `futhr-ui` |
| Public waitlists | `pnpm build:waitlist` | `apps/waitlist/.svelte-kit/cloudflare/` | `apps/waitlist/wrangler.toml` | SvelteKit Worker, name `waitlist-web` |
| List administration | bundled by Wrangler | Worker code | `apps/waitlist/wrangler.admin.toml` | Module Worker, name `waitlist-admin` |

The showcase and Storybook serve static files. The waitlist public Worker
renders pages and accepts forms; its asset binding serves hashed files and
brand icons. The admin Worker lists records and resolves withdrawal requests. Neither sends email.

The production waitlist configs bind the EU-jurisdiction `waitlist` D1 database.
The local development environment retains a non-production placeholder ID because
Wrangler uses a local database there. The configs declare ten public Custom
Domains and `lists.futhr.io`, but that does not establish that those domains are
provisioned. The Storybook config declares `ui.futhr.io` as a Custom Domain.

## Live account status

| Resource | Status on 7 September 2026 |
| --- | --- |
| Showcase | Production Pages deployment is healthy at `futhr.io`; the five venture links say “Join waitlist” |
| `www.futhr.io` | Still reaches the previous Netlify site; it needs the redirect cutover below |
| Storybook | Worker `futhr-ui` is deployed and `ui.futhr.io` is attached; the site sends `X-Robots-Tag: noindex, nofollow` |
| D1 | Database `waitlist` exists with EU jurisdiction and both committed migrations applied |
| Waitlist Workers | `waitlist-web` and `waitlist-admin` are not deployed |
| Venture zones | Not present in the Cloudflare account; their authoritative DNS remains Namecheap BasicDNS |
| Git deployment | The `futhr` Pages project is Direct Upload; deployments are manual and no deploy CI is configured |

The authenticated Wrangler session can deploy Pages, Workers, and D1, but its
OAuth grant cannot create zones, edit DNS, inspect billing, or administer
Access. Those remaining account actions must be performed in the dashboard or
with a separately scoped API token.

## Authentication

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

1. In Cloudflare, confirm the account is on **Workers Free**. A zone's “Free
   Website” plan is separate and does not prove the Workers plan. Do not proceed
   if Workers Paid is enabled without a new cost review.
2. Fix `www.futhr.io` with **Rules > Bulk Redirects**. Create a `301` from
   `https://www.futhr.io/` to `https://futhr.io/` with subpath matching,
   preserved path suffix, and preserved query string. Replace the old Netlify
   DNS record with a proxied `A` record named `www` whose address is
   `192.0.2.1`. Verify a nested path and query, not only `/`.
   [Pages www redirect](https://developers.cloudflare.com/pages/how-to/www-redirect/)
3. Use **Account home > Domains > Onboard a domain** to add `rivure.com`,
   `diggymon.com`, `refpath.io`, `reloved.eco`, and `orvane.io` as Free full
   zones. Review the quick scan manually; it can miss uncommon records.
   [Full zone setup](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/),
   [quick-scan limits](https://developers.cloudflare.com/dns/zone-setups/reference/dns-quick-scan/)
4. Before changing nameservers, compare each new Cloudflare zone with both the
   Namecheap export and **Hostinger > Emails > Mailboxes > Domain settings**.
   Preserve every current MX, SPF, DKIM, DMARC, and verification record; keep
   mail records DNS-only. Account values shown by Hostinger take precedence
   over the dated public baseline above.
5. Remove the imported Namecheap parking `A` record at each venture apex before
   deploying `waitlist-web`; the Worker Custom Domains will create their own
   DNS records and certificates. There are currently no public `www` records,
   and the Worker deployment will create those too.
6. At Namecheap, check DNSSEC first. If a DS record is active, remove it and
   wait for its TTL to expire before changing nameservers. Then choose
   **Domain List > Manage > Nameservers > Custom DNS**, enter the two
   nameservers assigned by that domain's Cloudflare zone, and save. Namecheap
   does not copy DNS records during this change. Wait for every Cloudflare zone
   to become Active, test web and mail, then enable Cloudflare DNSSEC and add
   its new DS record at Namecheap.
   [Cloudflare DNSSEC](https://developers.cloudflare.com/dns/dnssec/),
   [Namecheap nameservers](https://www.namecheap.com/support/knowledgebase/article.aspx/767/10/how-to-change-dns-for-a-domain/)
7. In Zero Trust, enable independent MFA, create a self-hosted public
   application for `lists.futhr.io`, and attach an Allow policy restricted to
   the exact operator/reviewer identities. Do not use an unrestricted
   “Everyone” or login-method-only rule. Require independent MFA at the
   application or policy level. Create a separate Service Auth policy only for
   an automation that has its own service token.
   [Access application](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/),
   [independent MFA](https://developers.cloudflare.com/cloudflare-one/access-controls/access-settings/independent-mfa/),
   [service tokens](https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/)
8. Record the Access team domain and application audience. Generate and store
   the waitlist encryption and digest keys in the team's secret manager, then
   set the runtime secrets listed in the package operating guide. The public
   and admin Workers must receive the same active encryption and digest keys.
   Fill the operator and reviewer grant maps with exact identities and brand
   IDs. Setting a secret with `wrangler secret put` deploys a Worker version, so
   do this only when the intended routing and Access protection are ready.
9. Deploy `waitlist-admin` only after Access exists, then deploy
   `waitlist-web` after all five venture zones are Active. Run every release
   check and the legal receipt-to-resolution test before opening collection.

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

pnpm storybook:deploy

pnpm build:waitlist
pnpm --filter waitlist exec wrangler deploy --env=""
pnpm --filter waitlist exec wrangler deploy --config wrangler.admin.toml
```

The site uses the Pages command while `wrangler.toml` contains
`pages_build_output_dir`. Verify the Pages project name in the account before
publishing. Do not use the proposed Workers migration command with that config.

These commands only bundle and validate the Worker deployment packages:

```sh
pnpm exec wrangler deploy --config wrangler.storybook.toml --dry-run
pnpm --filter waitlist exec wrangler deploy --env="" --dry-run
pnpm --filter waitlist exec wrangler deploy --config wrangler.admin.toml --dry-run
```

CI runs tests and these three dry runs. It does not deploy. Any future deploy
job must wait for both `verify` and `waitlist`, use the relevant package's
config, and receive a token scoped to the resources it changes.

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
HSTS with `includeSubDomains`; verify HTTPS support across the venture's
subdomains before using that policy in production.

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
- Each venture serves its own page, manifest, icons, privacy notice, and withdrawal form.
  `www` redirects to the matching apex with path and query intact.
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
