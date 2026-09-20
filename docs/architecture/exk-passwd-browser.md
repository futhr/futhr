# ExkPasswd browser architecture

Research checked on 19 September 2026.

This document defines the production architecture for running ExkPasswd in the
browser, distributing it as a static web application/PWA and browser extension,
and keeping the Elixir library as the only password-generation implementation.

The browser product belongs to the Futhr site and links from the existing
`src/lib/content/exk-passwd.md` showcase entry. The cryptographic library
remains in `futhr/exk_passwd`; Futhr owns the presentation, deployment,
extension packaging, and public trust surface.

## Goals

The browser product must:

- run the real ExkPasswd Elixir implementation rather than a JavaScript rewrite;
- generate passwords entirely on the user's device;
- keep `:crypto.strong_rand_bytes/1` as the library-level randomness contract;
- adapt that contract in the browser to Web Crypto's
  `crypto.getRandomValues()`;
- preserve ExkPasswd's rejection sampling and generator-aware entropy model;
- ship as static Cloudflare-hosted assets with no password-generation backend;
- support an installable PWA and Chrome extension around the same versioned
  browser core;
- request the minimum possible browser-extension permissions;
- work offline once installed;
- make the browser runtime and release provenance auditable;
- fail closed if cryptographic randomness, WebAssembly isolation, or runtime
  integrity requirements are not satisfied.

The browser project must not weaken the native BEAM implementation to
accommodate the browser.

## Repository boundaries

The implementation spans two public repositories.

### `futhr/exk_passwd`

Owns:

- password generation;
- configuration validation;
- presets;
- dictionaries and transforms;
- entropy and strength calculations;
- the native BEAM security model;
- any narrow portability seam required for AtomVM, provided it does not weaken
  the default BEAM path.

It remains the canonical implementation and Hex package.

### `futhr/futhr`

Owns:

- the public generator page;
- the PWA;
- the Chrome extension user interface;
- AtomVM browser packaging;
- Cloudflare deployment;
- browser and extension end-to-end tests;
- release provenance and browser-artifact verification;
- the public trust/explanation page;
- the link from the current ExkPasswd showcase entry.

The browser product must not duplicate ExkPasswd's algorithm in TypeScript.

## Existing Futhr insertion points

The current ExkPasswd showcase record is:

`src/lib/content/exk-passwd.md`

It currently links to the repository and HexDocs. The browser work should add a
prominent generator link and, once extension distribution is live, a Chrome
extension install link.

The architectural convention already used by this repository is
`docs/architecture/`, so this document lives there.

The existing deployment record is
`docs/architecture/cloudflare.md`. Browser deployment changes should extend
that document rather than create a second source of truth for Cloudflare account
state.

## Runtime architecture

The core rule is:

> JavaScript owns browser integration and UI. Elixir owns password semantics.

The production request path is:

```text
Futhr static UI
    |
    | serialisable command
    v
Browser bridge
    |
    v
AtomVM / WebAssembly
    |
    v
ExkPasswd browser server
    |
    v
ExkPasswd
    |
    v
:crypto.strong_rand_bytes/1
    |
    v
AtomVM browser crypto adapter
    |
    v
crypto.getRandomValues()
```

The browser-facing Elixir process should expose a deliberately small protocol,
for example:

- `generate`;
- `calculate_entropy`;
- `presets`;
- `runtime_info`.

Do not expose arbitrary MFA invocation, eval-like behaviour, module names
supplied by the browser, VM internals, seeds, or raw random bytes.

## AtomVM and Popcorn

AtomVM is the preferred production runtime because it executes BEAM bytecode in
the browser and preserves the strongest product property: ExkPasswd itself is
running, rather than a port of ExkPasswd.

Popcorn is useful as the browser bridge and build tooling around AtomVM. Its
stable AtomVM-based line already covers:

- compiling/cooking BEAM modules into an `.avm` bundle;
- browser runtime assets;
- JavaScript-to-Elixir messaging;
- bundler integration.

The browser build must pin the exact versions/commits of:

- Elixir;
- OTP;
- AtomVM;
- Popcorn;
- Emscripten;
- Node;
- pnpm;
- JavaScript dependencies.

Do not allow an unreviewed dependency upgrade to change the browser runtime
family.

### Why not BEAM-to-WasmGC for production

Direct BEAM-to-WasmGC work remains worth tracking as research and differential
testing, but it is not the production target while its own documentation
describes the implementation as experimental and semantically incomplete.

A production security-sensitive password generator should prefer the mature
AtomVM execution model until another implementation can meet the same semantic
and release gates.

## Cryptographic randomness boundary

This is the most important browser-specific security boundary.

The current ExkPasswd implementation ultimately calls:

```elixir
:crypto.strong_rand_bytes(n)
```

and performs unbiased rejection sampling in Elixir. That public semantic
contract should remain unchanged.

The browser runtime must provide an AtomVM implementation of
`:crypto.strong_rand_bytes/1` backed by Web Crypto:

```js
crypto.getRandomValues(view)
```

The adapter must:

1. allocate the requested binary;
2. fill it completely with Web Crypto;
3. chunk requests if necessary to respect the Web Crypto per-call limit;
4. return only after a complete successful fill;
5. raise/fail closed on any error;
6. have no fallback.

Forbidden fallbacks include:

- `Math.random()`;
- `:rand`;
- `Enum.random/1`;
- timestamps;
- process identifiers;
- user-provided seeds;
- AtomVM non-cryptographic random helpers;
- Emscripten non-cryptographic random helpers.

A browser build is not releasable until an automated test proves that
ExkPasswd's strong-random call reaches the WebCrypto adapter.

Reference:

- Web Crypto `getRandomValues()`:
  <https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues>

## Deterministic test seam

Cross-runtime equivalence requires deterministic random input without changing
the production security path.

The library should gain a narrow internal random-byte abstraction only if one
does not already exist. The production implementation remains
`:crypto.strong_rand_bytes/1`; tests may inject a deterministic byte stream.

The test seam exists to prove that native BEAM and AtomVM produce the same
results for the same byte sequence and configuration.

It must not become a public "seeded password generator" API.

## AtomVM compatibility audit

Before implementation is considered complete, every runtime dependency used by
the browser path must be audited against AtomVM support.

The audit must cover at least:

- `:crypto.strong_rand_bytes/1`;
- binary operations;
- `:binary.decode_unsigned/1`;
- Unicode/string functions used by configuration and transforms;
- maps, ranges, tuples, protocols and behaviours used by ExkPasswd;
- `:persistent_term` usage in custom dictionaries;
- supervision/GenServer requirements;
- application environment access;
- file access under `priv/`;
- Pinyin/Romaji and other transforms;
- any OTP module not available in AtomVM.

Where a facility is unsupported, prefer one of these in order:

1. compile-time generation;
2. a browser-only adapter behind an internal behaviour;
3. upstream AtomVM support;
4. explicit browser feature exclusion with a documented reason.

Do not silently change semantics.

## Dictionary packaging

Do not assume AtomVM can use the native package's `priv/` filesystem layout
unchanged in the browser.

The browser build should verify the canonical dictionary checksum and then
compile the dictionary into the browser bundle or otherwise package it as a
versioned, integrity-checked first-party asset.

The browser release manifest must record:

- exact ExkPasswd Hex package version and lock checksums;
- dictionary checksum;
- word count;
- browser-core version.

The browser and native library must use the same canonical dictionary data.

## Browser core artifact

Build a single versioned browser-core release artifact and reuse those exact
bytes in the site, PWA, and Chrome extension.

Example shape:

```text
exk-passwd-browser-core/
  manifest.json
  SHA256SUMS
  sbom.spdx.json
  licenses/
  core/
    AtomVM.wasm
    AtomVM.mjs
    runtime.html
    runtime-entry.mjs
    bridge.mjs
    exk_passwd.avm
```

The manifest should include at least:

- browser-core version;
- Futhr source commit;
- ExkPasswd Hex package version and lock checksums;
- AtomVM commit;
- Popcorn version;
- Elixir/OTP versions;
- Emscripten version;
- dictionary checksum;
- per-file SHA-256 digests.

Downstream packaging jobs must consume this artifact rather than rebuilding it.

## Browser host hardening

The browser host must use a strict CSP and contain no third-party runtime code.

Avoid inline runtime bootstrapping. If Popcorn's current host mechanism relies
on `srcdoc` plus inline module scripts, patch or wrap it with a packaged
same-origin `runtime.html` that loads only external first-party modules.

Prefer a dedicated `MessageChannel` between the UI and runtime after
initialisation. At minimum, validate both source window and expected origin.

No generated password may appear in:

- URLs;
- query strings;
- fragments;
- logs;
- analytics;
- exception telemetry;
- localStorage;
- IndexedDB;
- Cache Storage;
- service-worker messages;
- extension storage.

## Cloudflare hosting model

The password generator should be a static deployment.

Do not introduce:

- a Worker generation endpoint;
- a Pages Function for generation;
- a database;
- server-side password logging;
- server-side entropy calculation.

GitHub Actions should build, test and attest the static artifact. Cloudflare
should receive only the already-built output.

The existing Futhr Pages project uses Direct Upload, which fits this model.

Reference:

- Cloudflare Pages Direct Upload:
  <https://developers.cloudflare.com/pages/get-started/direct-upload/>

## Required browser headers

AtomVM's normal Emscripten browser profile depends on cross-origin isolation.

The static browser-generator path must serve at least:

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Resource-Policy: same-origin
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
```

The generator page should also use a restrictive CSP such as:

```text
default-src 'self';
script-src 'self' 'wasm-unsafe-eval';
style-src 'self';
img-src 'self' data:;
font-src 'self';
connect-src 'self';
worker-src 'self' blob:;
frame-src 'self';
object-src 'none';
base-uri 'none';
form-action 'none';
frame-ancestors 'none';
manifest-src 'self'
```

The final CSP must be derived from the actual built application and verified in
browser tests.

Cloudflare Pages supports static response headers through `_headers`.

Reference:

- Cloudflare Pages headers:
  <https://developers.cloudflare.com/pages/configuration/headers/>

## Caching and PWA

The PWA should cache only static application/runtime assets.

Passwords and entropy results must never be cached.

Recommended policy:

- versioned browser-core assets: long-lived immutable cache;
- service worker: no-cache;
- web manifest: no-cache;
- HTML: fresh/revalidated according to the existing Futhr deployment policy.

The PWA release gate must prove:

1. install while online;
2. reload;
3. confirm cross-origin isolation;
4. go offline;
5. reload again;
6. confirm cross-origin isolation still holds;
7. boot AtomVM;
8. generate a password locally.

Updates must be atomic: the service worker may not mix runtime files from two
browser-core versions.

## Website UX

The generator page should present the useful properties of ExkPasswd rather than
generic password-generator conventions.

Primary surface:

- generated password;
- explicit copy action;
- regenerate action;
- preset selection;
- word count;
- separator;
- case mode;
- generator-aware entropy.

Advanced settings may expose the configuration already supported by ExkPasswd,
including digits, padding, substitutions and compatible transforms.

Do not present a generic green/red "password strength" meter as the primary
security explanation.

The page should explain the two entropy concepts already present in ExkPasswd:

- generator-aware seen entropy;
- blind character-class estimate.

The local-execution trust panel should expose:

- ExkPasswd version;
- browser-core version;
- AtomVM version/commit;
- dictionary checksum;
- WebCrypto as the entropy source;
- whether the runtime is cross-origin isolated;
- release verification link.

## Browser extension architecture

The extension is a wrapper around the same browser core.

It must not contain a second password implementation.

The preferred initial permission model is explicit user invocation with:

- `activeTab`;
- `scripting`.

Avoid persistent host permissions and broad content scripts.

A fill action should:

1. run only after an explicit user gesture;
2. inspect only the active element/page needed for the operation;
3. refuse unsupported/non-editable targets;
4. insert only the password the user just generated or requested;
5. avoid background page scraping.

Do not request permissions for:

- history;
- cookies;
- webRequest;
- all tabs;
- `<all_urls>`;
- unrelated storage;
- remote network hosts.

Once a password is intentionally inserted into a web page, that page can
observe its own password field. The extension must state this clearly rather
than implying it can protect against a hostile destination page.

## Chromium

Chromium Manifest V3 can declare COOP/COEP policy for extension pages and can
permit WebAssembly through extension CSP using `wasm-unsafe-eval`.

References:

- Extension CSP:
  <https://developer.chrome.com/docs/extensions/reference/manifest/content-security-policy>
- COEP manifest key:
  <https://developer.chrome.com/docs/extensions/reference/manifest/cross-origin-embedder-policy>
- COOP manifest key:
  <https://developer.chrome.com/docs/extensions/reference/manifest/cross-origin-opener-policy>
- Permissions:
  <https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions>
- Scripting API:
  <https://developer.chrome.com/docs/extensions/reference/api/scripting>

The Chromium extension release gate must prove:

- extension loads under MV3;
- strict CSP is enforced;
- WebAssembly boots;
- `crossOriginIsolated === true`;
- `SharedArrayBuffer` is available when required by the chosen AtomVM profile;
- WebCrypto-backed generation works;
- explicit fill works on a disposable test page;
- no unexpected network request leaves the extension.

## Extension-store distribution

The site and Chrome extension release package should embed the exact same
attested browser-core files.

Packaging must verify this byte-for-byte before publication.

Chrome Web Store reference:

- <https://developer.chrome.com/docs/webstore/publish>

Store disclosures should be simple and accurate:

- purpose: generate passwords locally and optionally fill the current password
  field on explicit user request;
- collected data: none;
- sold/shared data: none;
- remote code: none;
- remote password generation: none.

### Publisher identity and EEA trader declaration

The Chrome Web Store account owner must make an accurate self-declaration. Free
or open-source distribution does not by itself determine trader status.

For this project, select **trader** when the publisher account represents Futhr,
a registered business, self-employment, or professional software work. Select
**non-trader** only when the extension is published strictly as a private hobby,
outside any trade, business, craft, or profession. If that distinction is not
clear for the account owner, obtain legal advice before submitting the form.

Do not commit addresses, identity documents, payment details, or other account
verification data to either repository.

Chrome's current definition and disclosure requirements are documented at:

- <https://developer.chrome.com/docs/webstore/program-policies/trader-disclosure>

### Store upload packages

Build the browser application and Chrome extension directory from the repository
root:

```bash
pnpm build:exk-passwd
```

The upload roots are:

```text
apps/exk-passwd/dist-extensions/chromium/
```

Create the upload archive with the extension files, including `manifest.json`,
at the archive root:

```bash
(cd apps/exk-passwd/dist-extensions/chromium && \
  zip -rFS ../exk-passwd-chromium-0.1.0.zip .)
```

Use the manifest version in each archive name. Test the exact built directories
before packaging them. Do not upload the source directory or a ZIP containing an
extra parent directory.

The upload archive must contain exactly one file named `manifest.json`, at its
root. The browser-core release metadata is named
`browser-core/core-metadata.json` inside the Chrome package. Its bytes must match
the website's `browser-core/manifest.json`; only the package filename differs.

Packaging references:

- <https://developer.chrome.com/docs/webstore/prepare>

### Chrome Web Store first publication

1. Register a Chrome Web Store developer account, pay the one-time registration
   fee, enable two-step verification, and complete the developer profile,
   contact verification, and trader declaration.
2. Choose **New item** in the developer dashboard and upload the Chromium ZIP.
3. Complete **Store Listing**, **Privacy**, **Distribution**, and **Test
   instructions**.
4. Describe the single purpose as local password generation with optional fill
   on explicit user request.
5. Declare that the extension collects no data, sells or shares no data, loads
   no remote code, and performs no remote password generation.
6. Explain that `activeTab` and `scripting` are used only to fill the currently
   selected password field after an explicit action. The manifest requests no
   persistent host permissions.
7. Use controlled Futhr URLs for the support and official website fields.
8. Copy the canonical public listing URL once Google assigns the item ID.
9. Submit for review. Use deferred publishing if the website and extension must
   launch together.

Future uploads must use the existing item and a higher manifest version. Do not
create another store item for an update.

Chrome references:

- <https://developer.chrome.com/docs/webstore/register>
- <https://developer.chrome.com/docs/webstore/publish>
- <https://developer.chrome.com/docs/webstore/cws-dashboard-listing>
- <https://developer.chrome.com/docs/webstore/cws-dashboard-distribution>

### Store URL configuration

The website footer is the installation surface. Local and test builds may link
to the official store search. A release build must use the direct listing URL
through this public build input:

```text
VITE_EXK_PASSWD_CHROMIUM_STORE_URL
```

The URL is public configuration, not a secret. Configure it as a repository or
deployment environment variable and expose it to the build. Store API
credentials, signing material, account recovery data, and publisher identity
documents remain secrets.

Example release build:

```bash
export VITE_EXK_PASSWD_CHROMIUM_STORE_URL='https://chromewebstore.google.com/detail/<name>/<extension-id>'

pnpm build:exk-passwd:release
pnpm build:web
```

`build:exk-passwd:release` runs the non-blocking `stores:verify` gate. While
publisher verification is pending, a missing value produces a CI warning and
the build keeps the official store-search fallback. A supplied value is always
validated; non-HTTPS URLs, embedded credentials, custom ports, unofficial hosts,
search pages, and malformed listing paths fail the build.

The actual store-publish job must run the strict gate:

```bash
pnpm build:exk-passwd:publish
```

This command runs `stores:verify:strict` and fails when the canonical listing URL
is missing. Run `build:web` with the same verified value so the deployed footer
links to the reviewed item.

### First-release sequence

The permanent listing URL does not exist until the store item has been created,
so the first release is a two-pass process:

1. Build without the store URL variable. This produces a testable package and
   uses official store-search links on the website.
2. Create the Chrome Web Store draft item by uploading the `0.1.0` package.
3. Copy the canonical listing URL from the dashboard.
4. Set `VITE_EXK_PASSWD_CHROMIUM_STORE_URL` in the release environment.
5. If the store requires a replacement package, increment the extension manifest
   version.
6. Run the release build and recreate the ZIP file.
7. Upload the replacement ZIP to the existing store item.
8. Submit the item for review.
9. After approval or scheduled publication, run `pnpm build:web` with the same
   URL and deploy the site.
10. Verify the production footer link and install the extension into a clean
    Chrome profile.

Later releases reuse the same Chrome item and listing URL. Increment the package
version and upload updates to the existing item.

## Threat model

### Protected by the architecture

| Threat | Control |
| --- | --- |
| Cloud/server learns passwords | Static site, no generation endpoint |
| Network observer sees passwords | Passwords never leave browser memory |
| Weak RNG fallback | WebCrypto-only adapter, fail closed |
| Modulo bias | Existing ExkPasswd rejection sampling |
| Runtime drift | One versioned browser-core artifact |
| Third-party script compromise | No third-party runtime scripts |
| XSS amplification | Strict CSP, no inline runtime code |
| Excessive extension privilege | Explicit invocation, `activeTab` + `scripting` |
| Secret persistence | No application storage/cache/logging of passwords |
| Supply-chain ambiguity | pinned toolchain, hashes, SBOM, provenance |
| Cloudflare build compromise | Cloudflare distributes prebuilt tested artifacts |

### Out of scope

The product must not claim protection against:

- a compromised browser;
- a malicious extension with sufficient privileges;
- OS malware;
- keyloggers;
- clipboard-stealing software;
- a destination site reading the password after the user intentionally inserts
  it;
- physical memory inspection;
- guaranteed secret zeroisation across JavaScript, WebAssembly and
  garbage-collected Elixir heaps.

## Failure behaviour

Security-sensitive failures must fail closed.

### WebCrypto unavailable

Do not generate. Present a clear browser/runtime error.

### AtomVM boot failure

Do not fall back to a JavaScript generator. Offer troubleshooting and a link to
the native library documentation.

### Cross-origin isolation missing

Do not attempt the threaded AtomVM profile. Surface the exact missing capability.

### Corrupt/mismatched browser-core artifact

Refuse to boot after integrity verification fails.

### Stale PWA cache

Do not combine files from different core versions. Require an atomic update.

### Extension runtime failure

Do not fill a field and do not persist the failed password.

## Free OSS automation and testing

Prefer services that are free for public open-source repositories and do not
need generated passwords or runtime secrets.

### GitHub Actions

Use as the primary CI/release system.

Public repositories can use standard GitHub-hosted runners without Actions
usage charges.

Reference:

- <https://docs.github.com/en/billing/concepts/product-billing/github-actions>

Use Actions for:

- native ExkPasswd tests;
- browser-core build;
- AtomVM boot tests;
- Playwright;
- extension tests;
- reproducibility checks;
- SBOM generation;
- release packaging;
- Cloudflare Direct Upload.

### GitHub CodeQL

Useful for TypeScript/JavaScript and any maintained C/C++ browser-runtime patch.

Reference:

- <https://docs.github.com/en/code-security/code-scanning/introduction-to-code-scanning/about-code-scanning-with-codeql>

Do not treat CodeQL as coverage for Elixir; keep the existing Elixir quality and
security tooling in `futhr/exk_passwd`.

### Dependabot

Enable for:

- GitHub Actions;
- npm/pnpm dependencies where supported.

Version updates still require review; security-sensitive runtime upgrades should
not auto-merge.

### GitHub artifact attestations

Use provenance and SBOM attestations for the browser-core release.

Reference:

- <https://docs.github.com/actions/security-for-github-actions/using-artifact-attestations/using-artifact-attestations-to-establish-provenance-for-builds>

Users should be able to verify the release with `gh attestation verify`.

### Codecov

Both Futhr and ExkPasswd already use Codecov. Continue using it for coverage of
the code it supports.

### Playwright

Run Chromium and WebKit engine coverage in CI.

Use Playwright for:

- generator UI;
- cross-origin isolation assertions;
- offline PWA behaviour;
- network-negative tests;
- extension integration where supported;
- accessibility hooks;
- performance smoke measurements.

WebKit is useful engine coverage but must not be described as a replacement for
real Safari testing.

### BrowserStack open-source programme

BrowserStack advertises a free open-source programme that can add real
browser/device coverage, including Safari, subject to programme eligibility and
acceptance.

Reference:

- <https://www.browserstack.com/open-source>

Treat this as "free for accepted OSS projects", not as an unconditional
dependency.

The project must remain testable with GitHub Actions alone.

### OpenSSF Scorecard

Run OpenSSF Scorecard on the public repositories and publish results through
GitHub's recommended workflow/security surfaces.

Use it to track repository hygiene and supply-chain posture, not as a substitute
for the project's own threat model.

### Dependency and vulnerability scanning

Use:

- Dependabot alerts;
- GitHub dependency review on pull requests;
- OSV tooling where it adds ecosystem coverage;
- Elixir dependency audit already used by the library.

### Accessibility

Use automated accessibility checks in the existing Futhr testing stack, which
already includes Storybook/axe coverage.

The generator page must additionally cover keyboard-only operation, focus
management, reduced motion, labels, error announcements and copy feedback.

### Lighthouse/performance

Run Lighthouse against the built preview, following the existing Futhr rule:
never measure the development server.

Automate regression tracking for:

- accessibility;
- performance;
- PWA behaviour;
- best-practice/security regressions relevant to the static page.

Do not fail releases on arbitrary scores without a committed policy and
reviewable baseline.

## Testing matrix

A browser release is not ready unless all relevant layers pass.

### Native library

- existing `mix check`;
- all native unit/property tests;
- all presets;
- dictionary checksum;
- entropy calculations;
- transforms;
- rejection sampling.

### Cross-runtime equivalence

Using deterministic injected bytes:

- same config -> same password;
- same config -> same entropy result;
- same validation errors;
- same preset semantics;
- same substitution/case behaviour;
- same dictionary filtering;
- same rejection-sampling edge cases.

### Browser-core security

- WebCrypto adapter is reached;
- forced WebCrypto failure fails closed;
- non-cryptographic RNG helpers are unreachable from the password path;
- no password value appears in logs;
- no password value appears in storage.

### Browser application

For Chromium and WebKit engines:

- runtime boots;
- password generation works;
- presets work;
- advanced settings work;
- copy works;
- entropy display matches AtomVM response;
- no unexpected network request;
- strict CSP;
- cross-origin isolation where required;
- offline PWA generation.

### Chromium extension

- unpacked install;
- MV3 validation;
- AtomVM boot;
- generation;
- explicit fill;
- no broad host permission;
- no unexpected network request;
- strict CSP;
- packaged browser core matches release hashes.

### Reproducibility

Build the browser core twice from clean environments.

Prefer byte-identical artifacts. If the toolchain is not yet fully reproducible,
store diagnostic diffs and do not make a false reproducibility claim.

## Supply-chain controls

Pin:

- GitHub Actions by commit SHA;
- browser runtime commits/versions;
- Node/pnpm;
- JavaScript dependencies;
- Emscripten;
- Elixir/OTP used for the browser build.

Release assets should include:

- `SHA256SUMS`;
- SPDX or CycloneDX SBOM;
- source commit;
- toolchain versions;
- dependency licences;
- GitHub provenance attestation.

Cloudflare should deploy only a previously tested release artifact.

Store-upload jobs must verify the embedded browser core against the attested
artifact before upload.

The store listing URL is a public build input. CI runs `stores:verify` and emits
a warning while publisher verification is pending. Store-upload jobs must run
`stores:verify:strict` before publishing. A configured but invalid URL fails in
both modes. Store API credentials, signing material, and publisher identity
documents must be isolated from pull-request jobs and untrusted code.

## Proposed Futhr repository layout

The Futhr repository should own the web/extension packaging.

A concrete layout is:

```text
docs/
  architecture/
    exk-passwd-browser.md

src/
  lib/
    content/
      exk-passwd.md

apps/
  exk-passwd/
    README.md
    package.json
    src/
      site/
      extension/
      shared/
    static/
      _headers
      manifest.webmanifest
    browser-core/
      manifest.json
      core/
    extensions/
      chromium/
        manifest.json
    tests/
      e2e/
      extension/
      security/
    scripts/
      fetch-browser-core.ts
      verify-browser-core.ts
      package-chromium.ts
      verify-network.ts
```

The exact app directory can be adjusted to the repository's workspace
conventions when implementation starts, but browser packaging should remain
isolated from the existing showcase.

The ExkPasswd library repository should own only the library/runtime-portability
changes needed to produce the browser core.

## Proposed ExkPasswd repository additions

A likely shape is:

```text
futhr/exk_passwd/
  browser/
    mix.exs
    mix.lock
    lib/
      exk_passwd_browser/
        application.ex
        server.ex
        protocol.ex
    runtime/
      atomvm.lock
      emscripten.lock
      patches/
        atomvm-webcrypto.patch
        popcorn-static-runtime-page.patch
    scripts/
      build-core.sh
      verify-core.sh
      verify-dictionary.sh
  test/
    browser/
      conformance/
```

Keep `browser/` outside the Hex package files list.

If the portability work can be made smaller than this without losing
traceability, prefer the smaller shape.

## CI/release flow

The release graph should be:

```text
ExkPasswd source
    |
native tests
    |
browser-core build
    |
AtomVM conformance
    |
Playwright/security tests
    |
hashes + SBOM + attestation
    |
immutable browser-core artifact
    |
    +--> Futhr static site/PWA
    |
    +--> Chromium extension
```

The browser core is built once.

The site and extension jobs may not rebuild it.

Cloudflare deployment and extension-store upload happen only after all
release-gating tests pass.

The first store release has one additional bootstrap edge:

```text
generic store-search build
    |
create Chrome Web Store draft item
    |
canonical listing URL
    |
stores:verify:strict
    |
direct-link site and extension build
    |
store review + production deployment
```

This bootstrap does not create duplicate listings or change extension identity.
Before the URL exists, CI reports publish readiness as a warning. Later publish
jobs start at `stores:verify:strict` with the existing URL.

## Production-readiness checklist

- [ ] ExkPasswd remains the only password-generation implementation.
- [ ] Native BEAM behaviour is unchanged.
- [ ] Browser runtime versions are pinned.
- [ ] Browser `:crypto.strong_rand_bytes/1` is backed by WebCrypto.
- [ ] No weak RNG fallback exists.
- [ ] Deterministic cross-runtime vectors pass.
- [ ] Rejection sampling matches native BEAM.
- [ ] Dictionary data and checksum match native ExkPasswd.
- [ ] All supported presets pass browser conformance.
- [ ] Supported transforms pass browser conformance.
- [ ] Browser core is built once per release.
- [ ] Site, PWA, and Chrome extension consume identical core bytes.
- [ ] Strict CSP is enforced.
- [ ] No remote runtime code is loaded.
- [ ] No third-party analytics runs on the generator.
- [ ] No generated password is persisted.
- [ ] No generated password enters logs or URLs.
- [ ] Cloudflare hosts only static assets.
- [ ] Required COOP/COEP headers are verified after deployment.
- [ ] PWA can generate while offline.
- [ ] PWA updates are atomic.
- [ ] Chromium extension uses least privilege.
- [ ] Chromium MV3/AtomVM integration passes.
- [ ] Chrome publisher account, two-step verification, contact verification,
      and accurate EEA trader status are complete.
- [ ] Chrome Store Listing, Privacy, Distribution, and reviewer information are
      complete and consistent with the implementation.
- [ ] The extension package contains the attested browser core unchanged.
- [ ] The direct Chrome listing URL passes `stores:verify:strict`.
- [ ] The production footer link installs the Chrome extension.
- [ ] The Chrome item identity remains stable across updates.
- [ ] Browser core ships with checksums, SBOM and licence metadata.
- [ ] GitHub artifact provenance is generated and verifiable.
- [ ] Reproducibility is measured and accurately described.
- [ ] Public trust page explains local execution and its limits.
- [ ] Existing Futhr ExkPasswd showcase entry links to the generator.
- [ ] Automated accessibility checks pass.
- [ ] Automated network-negative tests pass.
- [ ] Deployment credentials are unavailable to untrusted pull-request code.

## Open technical spikes

These are unresolved platform questions, not reasons to reduce product scope.

### AtomVM WebCrypto implementation

Prove the cleanest implementation of `:crypto.strong_rand_bytes/1` for the
Emscripten target and upstream it where appropriate.

### Popcorn host CSP

Confirm whether the current Popcorn release can run without inline
`srcdoc` bootstrap under the desired extension CSP. Patch or wrap it if not.

### `priv/` and dictionary packaging

Prove the final browser packaging model and retain the canonical dictionary
checksum as a release invariant.

### Unicode/transforms

Audit every ExkPasswd transform used in-browser against AtomVM's available
Unicode/OTP support and add conformance vectors before enabling the transform in
the browser UI.

## References

Primary references used for this architecture:

- ExkPasswd repository: <https://github.com/futhr/exk_passwd>
- AtomVM: <https://www.atomvm.net/>
- Popcorn: <https://hex.pm/packages/popcorn>
- Web Crypto `getRandomValues`:
  <https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues>
- Cloudflare Pages Direct Upload:
  <https://developers.cloudflare.com/pages/get-started/direct-upload/>
- Cloudflare Pages headers:
  <https://developers.cloudflare.com/pages/configuration/headers/>
- Chrome extension CSP:
  <https://developer.chrome.com/docs/extensions/reference/manifest/content-security-policy>
- Chrome extension COEP:
  <https://developer.chrome.com/docs/extensions/reference/manifest/cross-origin-embedder-policy>
- Chrome extension COOP:
  <https://developer.chrome.com/docs/extensions/reference/manifest/cross-origin-opener-policy>
- Chrome extension permissions:
  <https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions>
- Chrome Web Store publishing:
  <https://developer.chrome.com/docs/webstore/publish>
- Chrome Web Store package preparation:
  <https://developer.chrome.com/docs/webstore/prepare>
- Chrome Web Store developer registration:
  <https://developer.chrome.com/docs/webstore/register>
- Chrome Web Store trader disclosure:
  <https://developer.chrome.com/docs/webstore/program-policies/trader-disclosure>
- GitHub Actions billing/public-repository behaviour:
  <https://docs.github.com/en/billing/concepts/product-billing/github-actions>
- GitHub CodeQL:
  <https://docs.github.com/en/code-security/code-scanning/introduction-to-code-scanning/about-code-scanning-with-codeql>
- GitHub artifact attestations:
  <https://docs.github.com/actions/security-for-github-actions/using-artifact-attestations/using-artifact-attestations-to-establish-provenance-for-builds>
- BrowserStack open-source programme:
  <https://www.browserstack.com/open-source>
