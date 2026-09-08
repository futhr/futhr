# Project landings

Server-rendered, stateless holding pages for WoTEx, Reloved, and Recetas. There
are no forms, browser scripts, cookies, analytics, data bindings, or runtime
secrets. The source and approved marks are separate from the waitlist app.

## Local development

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm landing:icons
pnpm --filter landing dev
```

Open `http://wotex.localhost:8788/`, `http://reloved.localhost:8788/`, or
`http://recetas.localhost:8788/` in Chromium. The bare loopback host returns
404. Stand-ins require the `local` Wrangler environment and are rejected in
production. Use `pnpm --filter landing exec vite dev` for editing with HMR;
release checks must use the built Worker.

## Commands

| Command from the root | Purpose |
| --- | --- |
| `pnpm build:landing` | Build the adapter output and check the artifact boundary |
| `pnpm check:landing` | Generate runtime types and check Svelte/TypeScript |
| `pnpm test:landing` | Unit, component, workerd, and desktop/mobile browser tests |
| `pnpm landing:icons` | Regenerate committed icons and 1200×630 social images |
| `pnpm --filter landing exec wrangler deploy --env="" --dry-run` | Validate the production bundle and config without publishing |

Edit `src/lib/projects.ts` for page content and the shared components under
`../../src/lib/components/logos` for marks. Regenerate icons after mark or
content changes. Recetas uses its approved public positioning and is indexed;
its private repository is not a public destination.

## Build and routing

`wrangler.build.toml` is adapter output configuration only. It writes
`.svelte-kit/cloudflare/app.js`; the artifact check excludes that server file
from the static upload. Never deploy the build config.

`wrangler.toml` deploys `src/worker.ts`, a host gate in front of the generated
adapter. The asset layer runs the Worker first. This protects the host boundary
even when an asset exists: unknown hosts get 404, all `www` requests get 308 to
their HTTPS apex, and only GET/HEAD reach the application. Root icon URLs map
to the resolved project's assets; direct internal paths return branded 404s.

Production binds ASSETS only. HTTP requests upgrade to the HTTPS apex in the
Worker, even without a zone redirect. HSTS is enabled for one year following
verification of all six HTTPS hostnames; it has no `includeSubDomains` or
preload directive. Cache policy is one hour for pages/metadata, one day for
images, and one year for immutable CSS/fonts. Errors are no-store.

## Release gate

Nothing in CI deploys. The landing Worker was deployed on 8 September 2026 to
all six Custom Domains. All three zones are active on Cloudflare; mail DNS was
compared before and after deployment and remained unchanged. The waitlist
Workers are still undeployed. Preserve mail records and follow
[the landing architecture](../../docs/architecture/project-landings.md) and
[Cloudflare operations](../../docs/architecture/cloudflare.md).

Reloved has been removed from the waitlist configuration. A read-only check
found zero Reloved subscriptions and withdrawal requests; repeat it before
release. Do not delete any new rows as part of a deployment.

For audit captures, start the built landing Worker on port 24176 and the built
showcase preview on port 24177, then run:

```sh
LANDING_AUDIT_DIR=/Users/roam/Desktop/project-landings-audit-2026-09-08 pnpm --filter landing exec node scripts/audit.ts
```

The audit contains desktop/mobile PNGs and measurements; these are local build
evidence, not proof of DNS or certificate correctness.

Use `node scripts/audit.ts --live` from this package to capture the live
landing domains and showcase. During DNS propagation, add `--authoritative-dns`
to resolve the landing apexes through their assigned `brenda.ns.cloudflare.com`
nameserver. This overrides DNS only inside the audit browser, keeps TLS
verification enabled, and records the override in the report. It does not
prove that every recursive DNS cache has expired. The release captures are at
`/Users/roam/Desktop/project-landings-live-audit-2026-09-08/`.
