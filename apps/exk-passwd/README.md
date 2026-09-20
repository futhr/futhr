# ExkPasswd browser product

This package builds the static ExkPasswd generator, installable PWA, and the
Chromium and Firefox Manifest V3 extension packages. All three consume the same
checked-in `browser-core/` bytes. Password generation and entropy calculations
remain in the canonical Elixir library running on AtomVM; TypeScript owns only
the browser shell and message bridge.

## Commands

```bash
pnpm check:exk-passwd
pnpm --filter exk-passwd-browser test:unit
pnpm --filter exk-passwd-browser test:e2e
pnpm build:exk-passwd
```

`pnpm build` integrates `dist/` at `/exk-passwd/` in the main static artifact.
The standalone extension directories are written to `dist-extensions/` and are
verified to embed byte-identical browser-core files.

## Refreshing the browser core

The sibling `futhr/exk_passwd` checkout owns the AtomVM bundle. From that
repository, run `browser/scripts/build-core.sh`. In this repository, build the
pinned FissionVM runtime and import both artifacts:

```bash
pnpm --filter exk-passwd-browser core:runtime
pnpm --filter exk-passwd-browser core:import
pnpm --filter exk-passwd-browser core:verify
```

The importer verifies the canonical dictionary checksum and records source,
runtime, patch, toolchain, licence, and file identities in the release manifest
and SPDX SBOM. Do not hand-edit anything under `browser-core/`.

The current clean-room measurement is documented in
[`runtime/reproducibility.md`](runtime/reproducibility.md). The AVM output is
not yet byte-reproducible, so the release manifest and checksums identify the
exact shipped bytes without claiming reproducibility.

## Security boundaries

- Web Crypto `getRandomValues` is the only password-randomness adapter and has
  no fallback.
- The UI never sends, logs, or persists generated passwords.
- The PWA may cache immutable program assets, never password values.
- Extensions request only `activeTab` and `scripting`, and fill only the active
  editable field after an explicit click.
- The runtime requires cross-origin isolation and a CSP that permits WebAssembly
  but not JavaScript `eval`.

The browser UI accepts ASCII punctuation for separators and padding. Native
ExkPasswd retains its full Unicode validation; the browser restriction is an
explicit AtomVM compatibility boundary, not a change to native semantics.

See [the architecture](../../docs/architecture/exk-passwd-browser.md) for the
release gates, threat model, and repository boundaries.
