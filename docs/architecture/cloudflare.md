# Cloudflare configuration guide

Status: 4 September 2026, written against the Cloudflare and Wrangler
documentation current on that date. Links point at the pages each statement
comes from. Nothing in this file is a credential; account IDs, tokens, zone IDs,
and beacon tokens are placeholders and must never be committed.

## What is deployed

The repository produces two independent static artifacts. Each has its own
Wrangler configuration and Cloudflare project, so a Storybook deploy can never
touch the site and vice versa.

| Artifact | Built by | Output | Config | Worker name | Intended host |
| --- | --- | --- | --- | --- | --- |
| Site | `pnpm build` | `build/` | `wrangler.toml` | `futhr` | `futhr.io` |
| Storybook | `pnpm storybook:build` | `storybook-static/` | `wrangler.storybook.toml` | `futhr-ui` | `ui.futhr.io` |

Both are fully prerendered. There is no server-side rendering, no request-time
data, and no Worker code. Cloudflare serves the files as static assets, and
[requests to static assets are free and unlimited](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/).

Cloudflare's current guidance is to [start new projects with Workers](https://developers.cloudflare.com/pages/)
rather than Pages: "Workers supports most Pages use cases and offers a broader
feature set." Storybook already deploys that way. The site configuration still
uses `pages_build_output_dir`, the Pages form; the migration is described at the
end of this guide and is a small, reversible change.

## Prerequisites

- A Cloudflare account with the `futhr.io` zone active on Cloudflare nameservers.
  Custom Domains "cannot be created on a zone you do not own"
  ([docs](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)).
- Node 24 and pnpm 11.24.0, as pinned in `package.json`.
- Wrangler is a dev dependency, so always run it through pnpm:
  `pnpm exec wrangler <command>`. Do not install a global copy; versions drift.

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
which is why neither Wrangler file in this repository contains `account_id`.
Keep it that way; the ID is not secret in the strict sense, but it has no
business in a public repository.

Local files Wrangler may create are already ignored: `.wrangler/` (local state,
which Cloudflare says [should be added to `.gitignore`](https://developers.cloudflare.com/workers/local-development/local-data/))
and `.dev.vars*` (local secrets; "should not be committed to git"
([secrets docs](https://developers.cloudflare.com/workers/configuration/secrets/))).
This project has no runtime secrets, so those files should not exist at all; if
one appears, something is misconfigured.

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
- `[observability]` persists request logs (three-day retention and 200,000 events
  per day on the free plan, [Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/)).
  Asset requests are served without invoking Worker code, so expect the log to be
  quiet; it exists to catch anything unexpected.
- `[[routes]]` with `custom_domain = true` makes the Worker the origin for the
  apex. Cloudflare "will create DNS records and issue necessary certificates on
  your behalf" ([custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)).
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

## Headers

Both artifacts ship a `_headers` file in their asset directory
(`static/_headers` for the site, `.storybook/static/_headers` for Storybook).
Cloudflare applies it to asset responses; the syntax is a URL pattern line
followed by indented `Name: value` lines, with at most 100 rules and 2,000
characters per line ([headers docs](https://developers.cloudflare.com/workers/static-assets/headers/)).

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
  Cache-Control: public, max-age=31536000, immutable
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
build if either is missing, and it rejects anything under `icons/` or other
site-only paths so the two artifacts stay separate.

## Custom domains, www, and TLS

1. **Apex.** Deploy the site Worker with the `[[routes]]` block above. Cloudflare
   creates the DNS record and certificate.
2. **www.** A Worker on `futhr.io` "will not receive requests sent to
   `www.futhr.io`, and vice versa". Do not attach the Worker to both. Create a
   Redirect Rule instead, following Cloudflare's
   [www-to-root example](https://developers.cloudflare.com/rules/url-forwarding/examples/redirect-www-to-root/):
   wildcard `https://www.*`, target `https://${1}`, status 301, preserve query
   string. A proxied DNS record for `www` must exist for the rule to run. The
   free plan allows ten single redirect rules.
   `_redirects` files cannot do this; domain-level redirects are listed as
   unsupported there ([redirects docs](https://developers.cloudflare.com/workers/static-assets/redirects/)).
3. **Storybook host.** Deploy `futhr-ui` with its own `[[routes]]` block for
   `ui.futhr.io`.
4. **TLS settings** under SSL/TLS in the dashboard for the zone:
   - Encryption mode Full (strict). The origin is Cloudflare itself, so this is
     free of origin-certificate work.
   - [Always Use HTTPS](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/always-use-https/)
     on, which "redirects all your visitor requests from `http` to `https`".
   - [Minimum TLS version](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/minimum-tls/)
     1.2. Cloudflare's default is 1.0, which the docs note is below the PCI
     requirement.
   - [Automatic HTTPS Rewrites](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/automatic-https-rewrites/)
     on, as a safety net against mixed content.
   - HSTS in the dashboard is optional if the `_headers` line above is used;
     do not enable both with different max-ages.

## Deploying

### From a workstation

```sh
pnpm build                     # writes build/ and verifies the artifact
pnpm exec wrangler deploy      # site, reads wrangler.toml
pnpm storybook:deploy          # Storybook, reads wrangler.storybook.toml
```

`wrangler deploy` uploads a new version and makes it live. To inspect or undo,
`pnpm exec wrangler versions list` and `pnpm exec wrangler rollback` are
available on both Workers.

### From GitHub Actions

The current CI workflow only verifies; it does not deploy. To deploy on pushes
to `main`, add a job that runs after the verification job succeeds, using
Cloudflare's [GitHub Actions guide](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/):

```yaml
  deploy:
    needs: verify
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
after `pnpm storybook:build`, or its own job.

Points that matter:

- Store the token and account ID as repository or environment secrets. Cloudflare
  is explicit: "Don't store the value of `CLOUDFLARE_API_TOKEN` in your
  repository, as it gives access to deploy Workers on your account."
- Create the token from the **Edit Cloudflare Workers** template
  ([template list](https://developers.cloudflare.com/fundamentals/api/reference/template/)),
  then restrict it: scope Account to this account only and Zone to `futhr.io`
  only. The template also grants KV, R2, and Tail permissions this project does
  not use; a custom token with Workers Scripts: Edit, Account Settings: Read, and
  Workers Routes: Edit (zone) is the tighter choice. Set an expiry and rotate.
- Pin `wranglerVersion` in the action to the version in `package.json` if the
  action's bundled Wrangler drifts from the local one.
- A GitHub `environment` with required reviewers turns the deploy into an
  approval step. Keep `permissions: contents: read`; the job needs nothing else.

### Workers Builds instead of Actions

Cloudflare can build and deploy from the Git repository directly
([Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)).
Settings for this repository: build command `pnpm build`, deploy command
`pnpm exec wrangler deploy`, root directory `/`. The dashboard Worker name must
match `name` in the config or "the build will fail". Builds generate their own
scoped API token, so no secret has to be created by hand. The trade-off is that
verification runs on Cloudflare's builder rather than in the CI matrix; keep the
GitHub workflow as the required check on pull requests either way.

## Limits that apply here

From [Workers limits](https://developers.cloudflare.com/workers/platform/limits/):
an individual asset may be at most 25 MiB, a free-plan version may contain
20,000 files, `_headers` allows 100 rules, and `_redirects` allows 2,000 static
plus 100 dynamic entries. The site is a few dozen files; Storybook is a few
hundred. Neither is near a limit, but the file-count ceiling is the one to watch
if Storybook ever gains large fixture sets.

## Optional analytics

[Cloudflare Web Analytics](https://developers.cloudflare.com/web-analytics/) is
available on all plans and does not log query strings. It works by injecting a
beacon script tagged with a site token. Adding it would change
`docs/legal/privacy.md`, which currently states the site has no analytics, and it
would need a `script-src` entry for `static.cloudflareinsights.com` in the CSP.
Decide the privacy stance first; do not enable the dashboard's automatic
injection casually.

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
6. Update the README deployment section; it still describes Pages settings.

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
```

Expected: security headers present, immutable caching on `/_app/*`, a 301 from
www, a 404 with the site's own page, `llms.txt` beginning with the site name,
and `X-Robots-Tag: noindex, nofollow` on Storybook.
