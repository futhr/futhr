# Multi-brand waitlist platform

Status: implemented in `apps/waitlist/`, not yet deployed. Written 4 September
2026, revised 5 September 2026. `apps/waitlist/README.md` is the operating guide;
this page records the design and what is still open.

## Decision

futhr.io stays a prerendered static site. The waitlists are a separate
application, deployment, and artifact: one public Worker, `waitlist-web`, serving
exactly five hostnames and collecting addresses, and one private Worker,
`waitlist-admin`, on `lists.futhr.io` behind Cloudflare Access, reading them.

The scope is deliberately small. A visitor joins, sees a confirmation on the
page, and hears nothing more. No email is sent, so there is no mail pipeline,
no confirmation token, no unsubscribe flow, and no queue. Each platform launches
in Elixir with its own branded list handling and go-to-market flow; until then
the list is a passive store read through the admin API.

- `rivure.com`
- `diggymon.com`
- `refpath.io`
- `reloved.eco`
- `orvane.io`

WoTEx is not on the list. It is fully open source and has no waitlist.

Each venture domain serves its landing page at `/`. A `www` hostname gets a `308`
to its apex with path and query intact; any other hostname gets a `302` to
`https://futhr.io/`. The Worker never serves the Futhr page or a default venture,
which the Workers tests check, and `futhr.io` has no waitlist route at all.

Custom Domains fit because they make the Worker the origin for every path on an
exact hostname, several domains can share one Worker, and there is no wildcard
matching. Apex and `www` are separate hostnames, which is why both are attached.
[Cloudflare Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)

| Deployable | Address | Capability | Artifact |
| --- | --- | --- | --- |
| Futhr showcase | `futhr.io` | Read-only editorial site | `build/` |
| Component workshop | `ui.futhr.io` | Storybook | `storybook-static/` |
| Venture waitlists | five venture domains | Branded page, privacy notice, join | `apps/waitlist/dist/public/` |
| List administration | `lists.futhr.io` | List, delete | Worker code only |

Both waitlist Workers set `workers_dev = false` and `preview_urls = false`, so
there is no `workers.dev` hostname and no versioned preview URL.
[Preview URLs](https://developers.cloudflare.com/workers/versions-and-deployments/preview-urls/)

The public Worker can create a row and has no read route. The admin Worker can
list and delete, and only through Access. That is a clearer boundary than an
admin path hidden inside the public application. Everything runs on the Workers
free plan.

## Page

One Svelte 5 page, rendered per brand from the closed brand map in
`src/lib/brands/brands.ts`. The map owns the host, brand id, lede, closing line, metadata, and
consent version. The brand is derived from the
request hostname, never from anything the browser sends. The marks are the
showcase's logo components and the stylesheet is the showcase's `site.css`
unchanged, so brand identity is the mark, the words, the icons, the social image,
and the metadata. There are no per-brand colours.

The public Worker is SvelteKit on the Cloudflare adapter, rendered per request.
A universal `reroute` hook maps every path on a venture hostname into that
brand's route tree, `handle` resolves the brand from the hostname before any
route runs and sets the response headers, and SvelteKit generates the CSP nonce
for a first-party-only policy. Hashed assets and the committed brand icons come from the static-asset binding;
the icons are generated from the marks by `scripts/icons.ts`.
[Static Assets binding](https://developers.cloudflare.com/workers/static-assets/binding/)

The page says as little as possible: one centred column on ink with the mark,
a "Waitlist" label, the brand name, its closing line, then a divider and the
form under a "Get notified" heading, with a Privacy link as the only footer.
No product copy, no countdown, and no links to futhr.io or the other ventures,
which would be noise on a page whose one job is the address. The form is a
SvelteKit form action: a plain post works without JavaScript, and with it the
result appears in place.

Each brand gets its own title, description, canonical URL, Open Graph image,
icons, manifest with `id: "/"`, one-URL sitemap, robots, and an `llms.txt` that
names the brand as pre-launch and links only to its own domain. Nothing
canonicalises to futhr.io, and the visible copy differs per brand so the pages are
not clustered as duplicates.
[Google canonicalisation](https://developers.google.com/search/docs/crawling-indexing/canonicalization)

There is no service worker. A one-field landing page gains nothing from offline
caching, and leaving it out avoids a persistent cache and the terminal-storage
question.

## Request flow

The public route table is closed: `/` with its form action, `/privacy`, the
generated documents, `/assets/*`, and `/icons/*`. Anything else is the branded
404. Wrong methods get `405` and rate-limited clients `429`. There is no CORS and
no JSON endpoint; the form posts to its own page, and SvelteKit refuses
cross-origin form posts before the action runs.
[OWASP REST security](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html)

Subscribing:

1. Resolve the brand from the hostname before reading anything else.
2. Drop the post silently, answering as if it succeeded, when the hidden
   honeypot field carries a value; people never see that field, bots fill every
   field they find.
3. Check email syntax. The mailbox is stored as typed; a lower-cased,
   NFC-normalised form is what duplicate detection digests.
4. Rate limit with the Workers binding, keyed by brand and client address, five
   per minute. The counter lives in the binding; the address is never stored.
   [Rate limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
5. Encrypt the address, digest it, and insert the row under the unique key on
   `(brand_id, email_digest)`. A duplicate is a no-op.

The answer is the same page in its joined state whether the address is new or
already on the list, so the list cannot be enumerated. A honeypot and a rate
limit are proportionate for a pre-launch list; if spam appears, an invisible
Turnstile widget can return behind the same action.
[OWASP email verification](https://cheatsheetseries.owasp.org/cheatsheets/Email_Validation_and_Verification_Cheat_Sheet.html)

Double opt-in moves to launch. The first message a platform sends asks the
address to confirm before anything else follows, which is where the evidence is
needed. Confirming at join time would need a mail pipeline for a list that
otherwise sends nothing.

## Data

One D1 database created with `--jurisdiction=eu`. The jurisdiction is fixed at
creation, and the Worker may still execute outside the region, so this is a
storage-residency setting, not a claim that every operation stays in the EU.
[D1 data location](https://developers.cloudflare.com/d1/configuration/data-location/)

Addresses are AES-256-GCM ciphertext under a versioned key. Duplicate detection
uses a keyed HMAC of brand and canonical address rather than a plain hash that
could be dictionary-tested. D1 encrypts at rest and in transit, but a database
export or authorised database access would otherwise reveal the list. Keys are
Worker secrets, separate from D1. Each row names the key version it was written
under, so a rotation is a one-off re-encryption and the admin Worker can read
every version still in use. Every statement binds its parameters.
[D1 data security](https://developers.cloudflare.com/d1/reference/data-security/),
[prepared statements](https://developers.cloudflare.com/d1/worker-api/prepared-statements/),
[OWASP cryptographic storage](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)

Full IP addresses, user agents, and referrers are not retained. Logs never carry
an address or an authorization header. There is no retention job: the notice
commits to a review every twelve months, and erasure goes through the admin
delete. Time Travel is short-horizon recovery, not an archive.

## Consent

An email address is personal data. The form names the single purpose and links a
layered notice at `/privacy` on each host that names the controller, the legal
basis, retention, recipients, and how to withdraw. The basis is consent under
Article 6(1)(a) GDPR: pressing the labelled join button is the affirmative act.
Double opt-in is not mandated; it happens in the platform's first message, as
above.
[GDPR](https://eur-lex.europa.eu/eli/reg/2016/679/oj),
[EDPB consent guidance](https://www.edpb.europa.eu/system/files/documents/files/file1/edpb_guidelines_202005_consent_en.pdf)

Swedish law needs prior consent for promotional email to a natural person, and
every marketing email needs a working stop address. The collector sends nothing;
the platform that eventually does must carry the stop address. IMY treats an
objection to direct marketing as absolute.
[Marketing Act sections 19 and 20](https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/marknadsforingslag-2008486_sfs-2008-486/),
[IMY on objections](https://www.imy.se/privatperson/dataskydd/dina-rattigheter/att-gora-invandningar/)

The consent version is stored on every record, so a wording change is a new
version and a fresh ask. Cross-venture mailing, profiling, and analytics are
outside this consent and would need a separate one.

Withdrawal is a message to the controller, executed through the admin delete.
GDPR wants withdrawal to be as easy as consent; for a list that never contacts
anyone, an email to the controller is proportionate, and it becomes self-service
the moment a platform sends its first message with a stop link.

The notice names the maintainer and the futhr.io contact mailbox as controller for
all five brands until the legal entities are settled; `src/brands/controller.ts`
is the one place to change. Cloudflare is the processor under its DPA. The
wording is an engineering draft, not a legal opinion, and should be reviewed
before production.
[Cloudflare DPA](https://www.cloudflare.com/cloudflare-customer-dpa/)

## Administration

`lists.futhr.io` sits behind Cloudflare Access. People authenticate with an
identity and MFA; each automation gets its own service token. The Worker validates
the `Cf-Access-Jwt-Assertion` signature, issuer, and audience itself rather than
trusting the header's presence, and maps the email or service-token common name
to brand grants through `ADMIN_BRAND_GRANTS`. The list returns addresses,
decrypted, in join order with a cursor. Every list read and every delete is
audited.
[Service tokens](https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/),
[JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)

## Rejected alternatives

| Alternative | Why not |
| --- | --- |
| `/waitlist` inside the Futhr SvelteKit app | Breaks the host and artifact boundary; the Futhr page on a venture host becomes an easy accident |
| Pick the brand in browser JavaScript | Wrong first paint and crawler metadata, spoofable brand input |
| Five copied applications | Isolation at the cost of drift across identical security, form, and legal behaviour |
| Admin routes inside the public Worker | Larger public capability surface |
| Plaintext email because D1 is encrypted | Database exports and authorised database access still reveal the list |
| Confirmation email at join time | A mail pipeline, queue, token flow, and unsubscribe pages for a list that otherwise sends nothing; the platform's first message confirms instead |
| A hosted list provider | Branded pages, EU residency, and ownership of the list are requirements, not preferences |
| A visible bot-check widget | A third-party iframe and script on an otherwise first-party page; the honeypot and rate limit cover a pre-launch list |

## Still open

Product and account decisions, not gaps the code should guess:

1. The legal controller and contact mailbox for each brand.
2. The review period, and what happens to a list whose platform is dropped.
3. Who gets human admin access and which automations need brand-scoped tokens.
4. Staging bindings. The Wrangler files carry a placeholder database id and no
   staging environment. Never bind staging to production data.

Attach the production Custom Domains only after the verification checklist in
[cloudflare.md](cloudflare.md) passes on a deployment.
