# Cloudflare configuration guide

Status: 5 September 2026, written against the Cloudflare, Wrangler, Namecheap,
and Hostinger documentation current on that date. Links point at the pages each
statement comes from. Account IDs, tokens, and zone IDs are placeholders and are
never committed.

## What is deployed

The repository produces four deployables. Each has its own Wrangler
configuration and Worker, so a deploy of one can never touch another.

| Deployable | Built by | Output | Config | Worker name | Hostnames |
| --- | --- | --- | --- | --- | --- |
| Site | `pnpm build` | `build/` | `wrangler.toml` | `futhr` | `futhr.io` |
| Storybook | `pnpm storybook:build` | `storybook-static/` | `wrangler.storybook.toml` | `futhr-ui` | `ui.futhr.io` |
| Venture waitlists | `pnpm build:waitlist` | `apps/waitlist/.svelte-kit/cloudflare/` | `apps/waitlist/wrangler.toml` | `waitlist-web` | five apexes and their `www` |
| List administration | none, Worker code only | | `apps/waitlist/wrangler.admin.toml` | `waitlist-admin` | `lists.futhr.io` |

The site and Storybook are fully prerendered: no Worker code, no request-time
data. Cloudflare serves the files as static assets, and
[requests to static assets are free and unlimited](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/).

The waitlist Workers run code on every request. `waitlist-web` resolves the
brand from the hostname, serves hashed assets, renders the pages, and writes to
D1; `waitlist-admin` reads and deletes records behind Cloudflare Access.
Nothing is emailed. Their design is in
[waitlist-platform.md](waitlist-platform.md) and their operating guide in
[apps/waitlist/README.md](../../apps/waitlist/README.md). This document covers
the Cloudflare side of all four.

Cloudflare's current guidance is to [start new projects with Workers](https://developers.cloudflare.com/pages/)
rather than Pages: "Workers supports most Pages use cases and offers a broader
feature set." Three of the four already deploy that way. The site configuration
still uses `pages_build_output_dir`, the Pages form; the migration is described
near the end of this guide and is a small, reversible change.

## Prerequisites

- A Cloudflare account with `futhr.io` and the five venture zones active on
  Cloudflare nameservers. Custom Domains cannot be created "on a zone you do not
  own" ([Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)).
  The venture domains are registered at Namecheap; moving their DNS is covered
  under [Zones and DNS](#zones-and-dns-namecheap-and-hostinger).
- The Workers free plan. It covers everything used here: static assets, D1,
  the rate-limiting binding, and Access for a small team.
- Node 24 and pnpm 11.24.0, as pinned in `package.json`.
- Wrangler is a dev dependency, so always run it through pnpm:
  `pnpm exec wrangler <command>`, or `pnpm --filter waitlist exec wrangler`
  for the waitlist package. Do not install a global copy; versions drift.

## Authentication without leaking anything

Two modes exist. Use the first on a workstation and the second in automation.

**Interactive.** `pnpm exec wrangler login` authorizes Wrangler through OAuth
([docs](https://developers.cloudflare.com/workers/wrangler/commands/general/)).
The resulting credentials live outside the repository in
`~/.config/.wrangler/config/default.toml`. They are plaintext unless
`CLOUDFLARE_AUTH_USE_KEYRING=true` is set, so treat that file like a password.

**Token.** Set `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in the
environment ([system variables](https://developers.cloudflare.com/workers/wrangler/system-environment-variables/)).
The account ID "can also be specified through the `CLOUDFLARE_ACCOUNT_ID`
environment variable" ([config reference](https://developers.cloudflare.com/workers/wrangler/configuration/)),
which is why no Wrangler file in this repository contains `account_id`. Keep it
that way; the ID is not secret in the strict sense, but it has no business in a
public repository. Scopes for a provisioning token are listed under
[API token for provisioning](#api-token-for-provisioning).

Local files Wrangler may create are already ignored: `.wrangler/` (local state,
which Cloudflare says [should be added to `.gitignore`](https://developers.cloudflare.com/workers/local-development/local-data/))
and `.dev.vars*` (local secrets; the docs say to "Add `.dev.vars*` and `.env*`
to your project's `.gitignore` file"
([secrets](https://developers.cloudflare.com/workers/configuration/secrets/))).
The site and Storybook have no runtime secrets, so those files should not exist
at their root. The waitlist package does have secrets: production values go in
with `wrangler secret put <KEY>`, and local development reads
`apps/waitlist/.dev.vars.local`, because "When a `.dev.vars.<environment-name>`
file exists, only that file loads" and the package runs the `local` environment.
`apps/waitlist/.dev.vars.example` is the committed template.

## Site configuration (recommended form)

Replace the contents of `wrangler.toml` with the Workers static-assets form
when migrating from Pages:

```toml
name = "futhr"
compatibility_date = "2026-09-03"
workers_dev = false
preview_urls = false

[assets]
directory = "./build"
not_found_handling = "404-page"

[observability]
enabled = true
head_sampling_rate = 1

[[routes]]
pattern = "futhr.io"
custom_domain = true
```

Why each line:

- `name` must be "alphanumeric characters and dashes only" and must match the
  Worker name in the dashboard if Workers Builds is used
  ([reference](https://developers.cloudflare.com/workers/wrangler/configuration/),
  [Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)).
- `compatibility_date` pins the runtime behaviour. Bump it deliberately, not as
  a side effect of other changes.
- `workers_dev = false` removes the public `*.workers.dev` hostname so the site is
  reachable only on its domain. `preview_urls` "defaults to the value of
  `workers_dev`"; it is set explicitly for clarity. Preview URLs "cannot currently
  be configured to run on a subdomain other than workers.dev"
  ([previews](https://developers.cloudflare.com/workers/configuration/previews/)).
- `[assets]` has no `main`: "the `main` key is optional for assets-only Workers".
  With no Worker script, unmatched requests fall through to the not-found
  handling. SvelteKit's adapter writes `build/404.html` (see `svelte.config.ts`),
  and `"404-page"` makes Cloudflare "serve the contents of the nearest `404.html`
  file with a `404 Not Found` status"
  ([static-site routing](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/)).
  `html_handling` stays at its default `auto-trailing-slash`, which the same page
  says "will usually give you the desired behavior automatically".
- `[observability]` persists request logs. Workers Logs keeps 200,000 events a
  day for three days on the free plan and 20 million a month for seven days on
  Paid; `head_sampling_rate` runs "from 0 to 1"
  ([Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/)).
  Asset requests are served without invoking Worker code, so expect this log to
  be quiet; it exists to catch anything unexpected.
- `[[routes]]` with `custom_domain = true` makes the Worker the origin for the
  apex. Cloudflare creates the DNS record and issues "an Advanced Certificate"
  ([Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)).
  The hostname must not already carry a CNAME record.

## Storybook configuration (as deployed)

`wrangler.storybook.toml` already uses the recommended form:

```toml
name = "futhr-ui"
compatibility_date = "2026-09-04"
preview_urls = true

[assets]
directory = "./storybook-static"
not_found_handling = "single-page-application"
```

Storybook is a single-page app, so unmatched routes "serve the contents of the
`/index.html` file with a `200 OK` status"
([SPA routing](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/)).
To publish it on `ui.futhr.io`, add:

```toml
workers_dev = false

[[routes]]
pattern = "ui.futhr.io"
custom_domain = true
```

Keep `preview_urls = true` only while the `workers.dev` subdomain is enabled;
once `workers_dev = false`, previews are unavailable and the flag is inert.

## Waitlist Workers configuration

`apps/waitlist/wrangler.toml` is the public Worker. The pieces and why they are
shaped that way:

- **Assets.** `main = ".svelte-kit/cloudflare/_worker.js"` and
  `[assets] directory = ".svelte-kit/cloudflare"` with `binding = "ASSETS"`,
  both written by `@sveltejs/adapter-cloudflare`. The adapter's Worker serves
  hashed files and brand icons from the binding and hands every other request to
  SvelteKit, whose `reroute` hook does the hostname routing
  ([binding](https://developers.cloudflare.com/workers/static-assets/binding/)).
- **D1 with an EU jurisdiction.** The database is created once with
  `wrangler d1 create waitlist --jurisdiction=eu`. "Jurisdictions can only be set
  on database creation and cannot be added or updated after the database
  exists", "the jurisdiction takes precedence and the location hint is ignored",
  and "Workers may still access the database constrained to a jurisdiction from
  anywhere in the world"
  ([data location](https://developers.cloudflare.com/d1/configuration/data-location/)).
  Time Travel covers 7 days on the free plan and "up to 30 days" on Paid, with
  `wrangler d1 time-travel restore YOUR_DATABASE --timestamp=UNIX_TIMESTAMP`
  ([Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/)).
  It is short-horizon recovery, not an archive.
- **Rate limiting.** `[[ratelimits]]` with `name`, `namespace_id`, and
  `simple = { limit = 5, period = 60 }`; `period` must be 10 or 60, and the
  binding answers `limit({ key })` with `{ success }`
  ([rate limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)).
  The key is brand plus client address and is never persisted.
- **Routes.** Ten `[[routes]]` entries with `custom_domain = true`: the five
  apexes and their `www` hostnames. The Worker answers `www` with a `308` to the
  apex and any other hostname with a `302` to `https://futhr.io/`.
- **`[env.local]`.** Same bindings, `routes = []`. When routes exist, `wrangler
  dev` derives a development host from the first pattern and "replaces the
  original Host header value with dev.host across every request"
  ([workers-sdk #13871](https://github.com/cloudflare/workers-sdk/issues/13871)),
  which would make every local request look like `rivure.com`. The CLI describes
  the flags as `--host`, "Host to forward requests to, defaults to the zone of
  project", and `--local-upstream`, "Host to act as origin in local mode,
  defaults to dev.host or route". With no routes, requests keep their real
  hostname, which the exact-host routing and the end-to-end tests depend on.
- **`workers_dev = false` and `preview_urls = false`** on both Workers, for the
  reasons given for the site.

`apps/waitlist/wrangler.admin.toml` is the admin Worker: the same D1 database,
no assets, one route for `lists.futhr.io`. Its secrets name the
Access team domain and application audience so the Worker validates the JWT
itself rather than trusting header presence.

## Zones and DNS (Namecheap and Hostinger)

The venture domains are registered at Namecheap and their mailboxes are hosted
at Hostinger. Custom Domains need each zone on Cloudflare nameservers, so DNS
moves to Cloudflare while Hostinger keeps the mail. Per domain:

1. **Add the zone.** In the dashboard select "Onboard a domain", enter the apex,
   and pick the free plan. Cloudflare scans existing records, but "the quick
   scan is not guaranteed to find all existing DNS records", and the setup guide
   singles out email records as commonly missed
   ([full setup](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/)).
2. **Check the mail records against Hostinger's published set**
   ([Hostinger records](https://www.hostinger.com/support/8671319-set-up-a-domain-for-hostinger-email-manually/)):

   | Type | Name | Value |
   | --- | --- | --- |
   | MX | `@` | `mx1.hostinger.com`, priority 5 |
   | MX | `@` | `mx2.hostinger.com`, priority 10 |
   | TXT | `@` | `v=spf1 include:_spf.mail.hostinger.com ~all` |
   | CNAME | `hostingermail-a._domainkey` | `hostingermail-a.dkim.mail.hostinger.com` |
   | CNAME | `hostingermail-b._domainkey` | `hostingermail-b.dkim.mail.hostinger.com` |
   | CNAME | `hostingermail-c._domainkey` | `hostingermail-c.dkim.mail.hostinger.com` |
   | TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@<domain>` |

   Keep the DKIM CNAMEs unproxied. A domain has one SPF record; if another
   sender is ever added to the apex, Hostinger's guidance is to "combine them in
   a single line" ([SPF](https://www.hostinger.com/support/1583673-what-is-the-spf-record-for-hostinger-email/)).
3. **Clear the web records.** Delete any `A`, `AAAA`, or `CNAME` for the apex
   and `www` that point at parking or web hosting. "You cannot create a Custom
   Domain on a hostname with an existing CNAME DNS record", and removing the
   rest keeps the first deploy from stopping on a conflict.
4. **Switch nameservers at Namecheap.** Domain List, Manage, Nameservers,
   Custom DNS, then the two names Cloudflare assigned, "in the `ns1.example.tld`
   format" ([Namecheap](https://www.namecheap.com/support/knowledgebase/article.aspx/767/10/how-to-change-dns-for-a-domain/)).
   If DNSSEC is on at Namecheap, disable it first: "Changing nameservers while
   DNSSEC is active can cause your domain to become unreachable." Activation can
   take up to 24 hours; mail keeps working throughout if step 2 was complete.
   Namecheap also has an API for this, `namecheap.domains.dns.setCustom`, which
   requires API access on the account and a whitelisted IPv4 address
   ([API intro](https://www.namecheap.com/support/api/intro/)).
5. **Re-enable DNSSEC** through Cloudflare once the zone is active, if it was on.

`futhr.io` is already on Cloudflare and is unaffected. `lists.futhr.io` is a
new hostname on that zone and needs no DNS work of its own; the Custom Domain
creates its record.

## Provisioning the waitlist

Order matters because later steps consume identifiers from earlier ones. The
package README lists the secret names; this section is the Cloudflare side.

1. **Database.** `wrangler d1 create waitlist --jurisdiction=eu`, paste the id
   into both Wrangler files, then `wrangler d1 migrations apply waitlist
   --remote`. The jurisdiction cannot be added later.
2. **Access.** Create the Zero Trust organisation if none exists; the free plan
   covers a small team ([plans](https://www.cloudflare.com/plans/zero-trust-services/)).
   Enable One-time PIN under Integrations, Identity providers; Access "can send a
   one-time PIN (OTP) to approved email addresses as an alternative to
   integrating an identity provider" ([OTP](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/)).
   Add a self-hosted application for `lists.futhr.io` with a policy allowing the
   maintainer's email; "Domains must belong to an active zone in your Cloudflare
   account" ([self-hosted app](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/)).
   Copy the audience: "Select Configure for your application. From Additional
   settings, copy the Application Audience (AUD) Tag"
   ([JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)).
   Set `ACCESS_TEAM_DOMAIN` and `ACCESS_AUDIENCE` on the admin Worker. For
   automation, create a service token and a second policy with the action set
   to Service Auth, "otherwise, Access will prompt for an identity provider
   login"; clients send `CF-Access-Client-Id` and `CF-Access-Client-Secret`, the
   token expires on the chosen duration, and rotation keeps the client id
   ([service tokens](https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/)).
   The Worker identifies a service token by the JWT's `common_name` claim and a
   person by `email`; both map to brands through `ADMIN_BRAND_GRANTS`.
3. **Keys and secrets.** Generate the encryption and digest keys and set them on
   both Workers with `wrangler secret put`, or all at once with
   `wrangler secret bulk`, which takes "up to 100 secrets per command"
   ([secrets](https://developers.cloudflare.com/workers/configuration/secrets/)).
4. **Deploy and attach.** Build with the production sitekeys and
   `WAITLIST_ENVIRONMENT=production`, then `wrangler deploy` for each config.
   The first deploy creates the Custom Domains. Verify with the checklist at the
   end before announcing any hostname.

## Headers

The site and Storybook ship a `_headers` file in their asset directory
(`static/_headers` and `.storybook/static/_headers`). Cloudflare applies it to
asset responses; the syntax is a URL pattern line followed by indented
`Name: value` lines, with "up to 100 header rules" and a 2,000 character line
limit ([headers docs](https://developers.cloudflare.com/workers/static-assets/headers/)).

The waitlist Worker sets headers on rendered responses in code, because "Custom
headers defined in the `_headers` file are not applied to responses generated by
your Worker code, even if the request URL matches a rule defined in `_headers`".
The page CSP with its nonce comes from `kit.csp` in `svelte.config.ts`; every
other response gets a closed policy, `Referrer-Policy: same-origin`, `nosniff`,
and a restrictive `Permissions-Policy` from `src/hooks.server.ts`; and
`apps/waitlist/_headers` covers the asset layer, with the adapter appending the
one-year immutable rule for `/_app/immutable/*`.

The site file today:

```text
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN
  Permissions-Policy: camera=(), geolocation=(), microphone=()

/_app/*
  Cache-Control: public, max-age=31536000, immutable

/icons/*
  Cache-Control: public, max-age=86400
```

Cloudflare's own [security headers example](https://developers.cloudflare.com/workers/examples/security-headers/)
adds two more that apply once the custom domain is live:

```text
/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Content-Security-Policy: default-src 'self'; script-src 'self' 'sha256-<hash>'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'; upgrade-insecure-requests
```

Notes before adding them:

- Add HSTS only after HTTPS is verified on every host under `futhr.io`. Cloudflare
  warns that if HTTPS is later removed, "your website becomes inaccessible to
  visitors for the duration of the Max Age Header"
  ([HSTS](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/http-strict-transport-security/)).
  Start at one month and raise it once stable; `preload` needs twelve months.
  The waitlist Workers already send HSTS on HTTPS responses; the venture zones
  have nothing else under them.
- `src/app.html` contains one inline script that sets `data-day` before first
  paint. Under a CSP it needs a hash. Compute it from the built page, since the
  build normalises whitespace:

  ```sh
  node -e "const h=require('fs').readFileSync('build/index.html','utf8');const s=h.match(/<script>([\s\S]*?)<\/script>/)[1];console.log('sha256-'+require('crypto').createHash('sha256').update(s).digest('base64'))"
  ```

  Re-run it whenever that script changes, and keep `'unsafe-inline'` out of
  `script-src`. Svelte's hydration script also runs inline, so verify the built
  page in a browser with the policy in report-only mode first
  (`Content-Security-Policy-Report-Only`) before enforcing.
- `style-src 'unsafe-inline'` is required because Svelte and the animation code
  set inline styles. This is the usual trade-off for static Svelte sites.
- The hashed `/_app/*` files are immutable by name, so a one-year
  `Cache-Control` is safe. HTML is intentionally left to Cloudflare's default
  handling so a deploy is visible immediately.

The Storybook file adds `X-Robots-Tag: noindex, nofollow` and ships a
`robots.txt` that disallows everything; `scripts/verify-artifact.ts` fails the
build if either is missing or if a site-only file such as the manifest or an icon
has been copied into the Storybook artifact.

## Custom domains, www, and TLS

1. **Apex.** Deploy each Worker with its `[[routes]]` block. Cloudflare creates
   the DNS record and certificate. "You can add multiple Custom Domains" to one
   Worker, up to 100 per zone
   ([limits](https://developers.cloudflare.com/workers/platform/limits/)). "When
   you delete a Custom Domain, the associated Advanced Certificate is not
   automatically deleted"; remove it by hand if a hostname is ever retired.
2. **www on futhr.io.** A Worker on `futhr.io` "will not receive requests sent
   to `www.futhr.io`, and vice versa". Do not attach the site Worker to both.
   Create a Redirect Rule instead, following Cloudflare's
   [www-to-root example](https://developers.cloudflare.com/rules/url-forwarding/examples/redirect-www-to-root/):
   wildcard `https://www.*`, target `https://${1}`, status 301, preserve query
   string. A proxied DNS record for `www` must exist for the rule to run. The
   free plan allows ten single redirect rules.
   `_redirects` files cannot do this; domain-level redirects are listed as
   unsupported there ([redirects docs](https://developers.cloudflare.com/workers/static-assets/redirects/)).
3. **www on the ventures.** No rules. The `www` hostnames are Custom Domains on
   `waitlist-web`, which answers them with a `308` to the apex, keeping path and
   query, and answers any hostname it does not know with a `302` to
   `https://futhr.io/`.
4. **Storybook and admin hosts.** `futhr-ui` on `ui.futhr.io` and
   `waitlist-admin` on `lists.futhr.io`, each with its own `[[routes]]` block.
5. **TLS settings** under SSL/TLS in the dashboard, for each of the six zones:
   - Encryption mode Full (strict). The origin is Cloudflare itself, so this is
     free of origin-certificate work.
   - [Always Use HTTPS](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/always-use-https/)
     on, which "redirects all your visitor requests from `http` to `https`".
   - [Minimum TLS version](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/minimum-tls/)
     1.2. Cloudflare's default is 1.0, which the docs note is below the PCI
     requirement.
   - [Automatic HTTPS Rewrites](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/automatic-https-rewrites/)
     on, as a safety net against mixed content.
   - HSTS in the dashboard is optional where a `_headers` line or Worker code
     already sends it; do not enable both with different max-ages.

## Deploying

### From a workstation

```sh
pnpm build                                   # writes build/ and verifies the artifact
pnpm exec wrangler deploy                    # site, reads wrangler.toml
pnpm storybook:deploy                        # Storybook, reads wrangler.storybook.toml
pnpm build:waitlist                          # builds the waitlist Worker and its assets
pnpm --filter waitlist exec wrangler deploy  # public waitlist Worker
pnpm --filter waitlist exec wrangler deploy --config wrangler.admin.toml
```

`wrangler deploy` uploads a new version and makes it live. To inspect or undo,
`pnpm exec wrangler versions list` and `pnpm exec wrangler rollback` are
available on every Worker. `wrangler deploy --dry-run` bundles and validates
without touching the account; CI runs it for the Storybook and both waitlist
configs.

### From GitHub Actions

The current CI workflow only verifies; it does not deploy. To deploy on pushes
to `main`, add a job that runs after the verification jobs succeed, using
Cloudflare's [GitHub Actions guide](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/):

```yaml
  deploy:
    needs: [verify, waitlist]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions:
      contents: read
    environment: production
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v4
        with:
          version: 11.24.0
      - uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: cloudflare/wrangler-action@v4
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy
```

Storybook gets a second step with `command: deploy --config wrangler.storybook.toml`
after `pnpm storybook:build`. The waitlist Workers get steps with
`workingDirectory: apps/waitlist`, one per config, after `pnpm build:waitlist`.
The sitekeys are `[vars]` in `wrangler.toml`, so the build needs no environment.
[wrangler-action](https://github.com/cloudflare/wrangler-action) v4 installs
Wrangler 4 by default; pin `wranglerVersion` to the version in `package.json`
if the two drift.

- Store the token and account ID as repository or environment secrets. Cloudflare
  is explicit: "Don't store the value of `CLOUDFLARE_API_TOKEN` in your
  repository, as it gives access to deploy Workers on your account."
- A deploy token needs less than a provisioning token: Workers Scripts Edit,
  Workers Routes Edit on the six zones, D1 Edit, and Account Settings Read. Set
  an expiry and rotate.
- A GitHub `environment` with required reviewers turns the deploy into an
  approval step. Keep `permissions: contents: read`; the job needs nothing else.

### Workers Builds instead of Actions

Cloudflare can build and deploy from the Git repository directly
([Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)).
For a monorepo, "Set the root directory for each Worker to specify the location
of its `wrangler.jsonc`", and "a new build and deploy will trigger for each
Worker if the change is within each of its included watch paths"; pnpm
workspaces are named as supported
([advanced setups](https://developers.cloudflare.com/workers/ci-cd/builds/advanced-setups/)).
Settings for this repository: the site with root directory `/`, build command
`pnpm build`, deploy command `pnpm exec wrangler deploy`; each waitlist Worker
with root directory `apps/waitlist`, build command `pnpm build`, deploy command
`pnpm exec wrangler deploy` or the same with `--config wrangler.admin.toml`. The
dashboard Worker name must match `name` in the config. Builds generate their own
scoped API token, so no secret has to be created by hand. The trade-off is that
verification runs on Cloudflare's builder rather than in the CI matrix; keep the
GitHub workflow as the required check on pull requests either way.

## API token for provisioning

Create it under My Profile, API Tokens, as a custom token rather than a
template; "The token secret is only shown once", and the form offers "Client IP
Address Filtering and TTL (time to live)"
([create a token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)).
Scope the zone permissions to the six zones, not all zones. Verify it with:

```sh
curl "https://api.cloudflare.com/client/v4/user/tokens/verify" --header "Authorization: Bearer <API_TOKEN>"
```

Permissions the provisioning steps above use:

| Scope | Permission | Used for |
| --- | --- | --- |
| Account | Account Settings: Read | Wrangler account lookup |
| Account | Workers Scripts: Edit | deploys, secrets |
| Account | D1: Edit | database and migrations |
| Account | Access: Apps and Policies: Edit | the admin application |
| Account | Access: Service Tokens: Edit | automation credentials |
| Zone | Zone: Edit | creating the venture zones |
| Zone | DNS: Edit | mail records and cleanup |
| Zone | Workers Routes: Edit | Custom Domains |

Keep the token in the shell environment or a file outside the repository, never
in a chat transcript or a commit, and revoke it when provisioning is done.

## Limits and analytics

Every artifact here is a few dozen to a few hundred files, far below the
[Workers limits](https://developers.cloudflare.com/workers/platform/limits/). The
free plan's 100,000 requests a day and D1's free reads and writes are far above
what five landing pages draw, so nothing here needs Workers Paid.

[Cloudflare Web Analytics](https://developers.cloudflare.com/web-analytics/) is
not enabled. Turning it on would contradict `docs/legal/privacy.md` and the
venture notices, which promise no analytics, and would need a `script-src` entry
for `static.cloudflareinsights.com`. Decide the privacy stance first; do not
enable the dashboard's automatic injection.

## Migrating the site from Pages to Workers

1. Replace `wrangler.toml` with the recommended block above and commit it.
2. Deploy once with `pnpm build && pnpm exec wrangler deploy`. The Worker is
   created on first deploy.
3. In the Pages project, remove the custom domain `futhr.io` so the hostname is
   free; a Custom Domain cannot be created "on a hostname with an existing CNAME
   DNS record".
4. Attach the Custom Domain to the Worker (redeploying with the `[[routes]]`
   block does this) and verify with the checklist below.
5. Add the www Redirect Rule, then delete the Pages project.

Cloudflare's [migration guide](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/)
confirms that "`_headers` and `_redirects` files are supported natively in
Workers with static assets", so no header changes are needed, but 404 and SPA
behaviour "must be set up manually", which the two `not_found_handling` values
above do.

## Verification checklist

Run after any deployment or settings change:

```sh
curl -sI https://futhr.io/ | grep -iE "^(strict-transport|content-security|x-content-type|referrer|permissions|cache-control|cf-ray)"
curl -sI https://futhr.io/_app/immutable/ 2>/dev/null | head -1        # hashed assets exist
curl -sI https://www.futhr.io/ | head -1                                # 301 to apex
curl -sI https://futhr.io/does-not-exist | head -1                      # 404, not 200
curl -s https://futhr.io/llms.txt | head -3                             # agent documents served
curl -sI https://ui.futhr.io/ | grep -i x-robots-tag                    # noindex on Storybook

for host in rivure.com diggymon.com refpath.io reloved.eco orvane.io; do
  curl -sI "https://$host/" | grep -iE "^(HTTP|content-security|strict-transport|cache-control)"
  curl -s "https://$host/manifest.webmanifest" | grep '"name"'         # the brand's own manifest
  curl -sI "https://www.$host/privacy?x=1" | grep -iE "^(HTTP|location)" # 308 to the apex
done
curl -sI https://lists.futhr.io/v1/brands | head -1                    # Access login, not JSON
```

Expected: security headers present on every host, immutable caching on hashed
assets, a 301 from `www.futhr.io`, a 404 with the site's own page, `llms.txt`
beginning with the site name, `X-Robots-Tag: noindex, nofollow` on Storybook,
each venture serving its own manifest name with a CSP that carries a fresh
nonce, a 308 from every venture `www`, a 415 for a non-JSON post, an Access challenge on the admin host, and a 404 for the
subscription path on `futhr.io`.
