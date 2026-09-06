# Cloudflare deployment

Checked against the repository on 6 September 2026. Configuration in Git
records deployment intent; account settings, DNS, and deployed versions must
be checked in Cloudflare before a release.

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

The waitlist configs contain placeholder D1 identifiers. They declare ten
public Custom Domains and `lists.futhr.io`, but that does not establish that
those domains are provisioned. The Storybook config does not declare a custom
domain; `ui.futhr.io` is an account-side setting to verify separately.

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

1. Create a D1 database with `pnpm --filter waitlist exec wrangler d1 create
   waitlist --jurisdiction=eu`. Set its identifier in both waitlist configs,
   then apply both committed migrations with `pnpm --filter waitlist exec wrangler d1 migrations apply
   waitlist --remote`. EU jurisdiction controls database storage location;
   Worker execution is a separate consideration.
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
pnpm --filter waitlist exec wrangler deploy
pnpm --filter waitlist exec wrangler deploy --config wrangler.admin.toml
```

The site uses the Pages command while `wrangler.toml` contains
`pages_build_output_dir`. Verify the Pages project name in the account before
publishing. Do not use the proposed Workers migration command with that config.

These commands only bundle and validate the Worker deployment packages:

```sh
pnpm exec wrangler deploy --config wrangler.storybook.toml --dry-run
pnpm --filter waitlist exec wrangler deploy --dry-run
pnpm --filter waitlist exec wrangler deploy --config wrangler.admin.toml --dry-run
```

CI runs tests and these three dry runs. It does not deploy. Any future deploy
job must wait for both `verify` and `waitlist`, use the relevant package's
config, and receive a token scoped to the resources it changes.

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
