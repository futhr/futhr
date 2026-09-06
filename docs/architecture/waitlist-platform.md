# Waitlist architecture

Implemented in `apps/waitlist/`. This document describes the code as of
6 September 2026. The committed production database IDs are placeholders;
provisioning and deployment are covered in [cloudflare.md](cloudflare.md).

## Boundaries

The showcase is static. The waitlists are a separate SvelteKit application
rendered by `waitlist-web`, with a private module Worker, `waitlist-admin`,
for administration. Both use one D1 database. The public application accepts
subscriptions and queues withdrawal requests; the private API exposes reads,
deletes, and operator resolution. These are application
boundaries: both Workers' D1 bindings have database access, not SQL-level
read-only or write-only grants.

The public brand map in `src/lib/brands/brands.ts` names five apexes:
`rivure.com`, `diggymon.com`, `refpath.io`, `reloved.eco`, and `orvane.io`.
Their `www` hosts redirect to the matching apex with path and query intact.
Unknown hosts redirect to `https://futhr.io/`. Local development also accepts
`<brand>.localhost` and provides a brand index on the loopback hostname.

The universal hook reroutes public URLs to
`src/routes/brands/[brand=brand]/`. The server hook sets `locals.brand` from
the hostname and applies response headers. Brand selection never comes from a
form field or an internal route segment supplied by the visitor.

## Pages and assets

Each brand serves `/`, `/privacy`, `/withdraw`, `/icons/*`, and the generated manifest,
robots, sitemap, and `llms.txt`. The build writes the Worker and assets to
`.svelte-kit/cloudflare/`. Hashed assets live under `/_app/immutable/`;
generated brand assets are also publicly reachable under `/brands/<id>/icons/`.
They contain public marks, not private brand data.

The landing page reuses the showcase's type, colours, and marks. A page shell
owns the layout; landing, privacy, and notice components supply the content.
`email-form.svelte` owns the shared email interaction, with copy passed as props.
The join wrapper adds consent links; the withdrawal route uses the same form. The form
works as a native POST and uses SvelteKit's `enhance` for in-place results.
There is no client data loader, third-party bot script, or service worker.
[SvelteKit form actions](https://svelte.dev/docs/kit/form-actions)

SvelteKit generates a nonce CSP for HTML. The server hook covers rendered
responses; `_headers` covers static assets. Icons have a one-day cache lifetime,
generated documents one hour, and admin responses are uncacheable. The font
licence ships under `static/licenses/archivo.txt` in both applications.

## Joining

The form action:

1. Reads at most 8 KiB before parsing the form. Oversized requests return 413;
   malformed form bodies return 400. SvelteKit rejects foreign-origin form
   submissions before the action runs.
2. Returns the success state without writing when the honeypot is filled.
   This catches some automated submissions; it does not establish humanity.
3. Validates a conservative ASCII email syntax. The trimmed address is kept
   for later contact. Duplicate detection uses its lower-case canonical form;
   lower-casing the local part is a deliberate simplification.
4. Applies the rate-limit binding using brand and client IP, five attempts per
   minute. This is a local, approximate abuse control, not a global quota.
   [Rate limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
5. Encrypts the address with AES-256-GCM and a fresh 96-bit IV. A keyed HMAC of
   brand and canonical address supplies the duplicate key. A unique constraint
   makes concurrent duplicate submissions a no-op.

New addresses and duplicates receive the same on-page result. The row stores
an ID, ciphertext, IV, digest, key version, consent version, and join time.
No email is sent. A submission does not verify ownership of the mailbox.

Keys are Worker secrets. Each row identifies its encryption key version, so
old keys must remain available until affected rows are re-encrypted or deleted.
The digest key must remain stable unless existing digests are migrated too.
The EU D1 jurisdiction controls database residency; it does not constrain every
Worker execution to the EU.
[D1 data location](https://developers.cloudflare.com/d1/configuration/data-location/)

## Administration

The admin hostname is `lists.futhr.io`, intended to sit behind Cloudflare
Access. The Worker independently verifies the Access JWT using `jose`: RS256,
issuer, audience, expiry, time claims, and a non-empty identity. Signing keys
are cached and refreshed through the remote JWKS resolver. Email or service-token
`common_name` maps to brand grants in `ADMIN_BRAND_GRANTS`.
[Cloudflare JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)

`GET /v1/brands` lists granted brands. The subscriptions endpoint returns
decrypted addresses in `(joined_at, id)` order, capped at 200 records per page.
A cursor advances through the composite index without scanning earlier pages.
Every returned page is audited before its response is sent.

A successful delete and its audit record share one D1 transaction. If either
statement fails, neither change commits. A missing or foreign-brand ID returns
404 without creating an audit entry.
[D1 batches](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch)

Application error logs contain fixed messages and status codes, not exception
text, subscriber addresses, or authorization headers. `audit_log.actor` can
contain an administrator's email address; it does not contain subscriber
addresses. Hosting request logs have separate account retention settings.

## Withdrawal requests and review

`withdrawal_requests` is a separate inbox, introduced by migration 0002. The
public action normalises the address and computes its keyed digest, then queues
a request only for an existing same-brand subscription. It stores the original
subscription ID and receipt time, not a second copy of the address. The pending
unique index makes repeats idempotent without resetting the receipt time.
Capacity checking and insertion share a D1 transaction; the ceiling is 1,000
pending records per brand. Non-members and duplicates get the same conditional
acknowledgement. If capacity is exhausted, every address gets 503 with an email
alternative. Invalid input, foreign origins, and rate limits fail explicitly.

A pending request changes neither subscription state nor consent evidence.
Operators must review pending requests before sending or exporting a list.
The original subscription ID prevents a stale request deleting a later join.
The public form does not authenticate the requester, and a match cannot prove
mailbox ownership. There is no signup secret or automatic verification flow.

The authenticated inbox list joins the two tables and exposes at most 50
metadata records per page. `ADMIN_REVIEWER_BRAND_GRANTS` allows only these reads
and brand discovery. Operators in `ADMIN_BRAND_GRANTS` can read address details
and resolve requests. If an identity has both grants, operator access wins;
never configure an AI reviewer with operator grants.

An operator attests mailbox evidence or an evidenced dismissal using a bounded
form body and an opaque case reference. Resolution closes the request, performs
any original-row deletion, and writes the audit event in one transaction. A
repeat cannot produce a second delete or audit. `already_absent` completes a
request only when the original row is absent, even if the address has since
joined again. No foreign-key cascade removes the evidence of receipt.

Public traffic invokes no email, AI, queue consumer, or paid external service.
An optional AI reviewer is a separately authenticated caller, invoked deliberately
by an operator. It gets no addresses and no mutation capability. Its output is
untrusted advice, never identity evidence or a reason to deny a valid request.
Metadata remains personal data and any external processor needs assessment.

## Consent and operations

The notice names the controller, contact purpose, manual request handling,
rights, and retention limits. Each subscription records the notice version in
force at submission; a revised notice does not rewrite earlier consent.
`controller.ts` sets twelve months for subscriptions, ninety days for closed
requests/correspondence, and twelve months for audit records. Monthly manual
reviews remove records due before the next review. Pending requests are checked
every working day and do not expire unanswered.

The [privacy operating procedure](../legal/waitlist-operations.md) defines
verification, response deadlines, handling of other rights, retention, restore
checks, and the account facts to confirm before collection. No retention job,
mail pipeline, AI integration, or reminder service runs automatically. The
mailbox, reminder schedule, legal facts, and Cloudflare configuration still
require the maintainer's setup. The Free-plan cost boundary is described in
[the deployment guide](cloudflare.md#cost-boundary).

## Verification

Node unit tests cover brands, generated assets and documents, email syntax,
crypto, headers, and JWT rejection. Workers tests exercise the built public
Worker and admin module against local D1, including concurrent duplicates,
brand authorization, pagination, transactional rollback, reviewer permissions,
inbox capacity, and protection of later re-subscriptions. Playwright checks
all five brands on desktop and mobile Chromium, native and enhanced forms,
metadata, and automated accessibility.

These checks do not verify production DNS, Access policies, secrets, or D1
provisioning. They also do not replace a screen-reader review or legal review
of the collection process.
