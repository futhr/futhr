---
name: password-browser
description: "Implement, diagnose or review the ExkPasswd PWA or extension runtime, browser-core import, randomness, clipboard or autofill behavior. Preserve canonical library ownership and inspect produced artifacts; skip showcase UI and native library algorithms."
user-invocable: false
---

# Change the password browser consumer

Read [the package guide](../../../apps/exk-passwd/README.md). TypeScript owns
the browser shell/message bridge; the canonical Elixir library on AtomVM owns
generation and entropy. Native Unicode support and the browser's explicit ASCII
separator/padding restriction remain different contracts.

Trace [the importer](../../../apps/exk-passwd/scripts/import-browser-core.ts),
[manifest verifier](../../../apps/exk-passwd/scripts/verify-browser-core.ts),
[runtime bridge](../../../apps/exk-passwd/src/browser-core.ts) and affected caller.
Do not hand-edit imported `browser-core/` AVM/WASM/runtime bytes. A library defect
belongs to its source owner; a reviewed FissionVM patch belongs to the existing
runtime/import pipeline. Rebuilding/importing is an authorized artifact operation,
not a prerequisite for a prose edit.

Choose the proof that the change needs:

- Import/package: exact published Hex/lock/dictionary/runtime/patch/license and
  file identities; verify built PWA and extension contain the intended bytes.
  The AVM is not claimed byte-reproducible: checksums identify shipped bytes.
- Randomness: actual Web Crypto `getRandomValues` failure/no-fallback behavior,
  not only source-token presence or manifest hashes. Never substitute `Math.random`
  or retain password values in logs, storage, analytics or service-worker caches.
- Bridge/lifecycle: bounded ready/failure paths, stale request results and owned
  cleanup; do not reuse a result for changed configuration.
- Autofill/clipboard: explicit user action, current active editable field and
  permitted origin/frame, using the existing minimal extension permissions.

Retain public acceptance and relevant refusal cases through
[unit security tests](../../../apps/exk-passwd/tests/unit/security.test.ts),
[Web Crypto browser tests](../../../apps/exk-passwd/tests/e2e/webcrypto.test.ts)
and [generator journeys](../../../apps/exk-passwd/tests/e2e/generator.test.ts).
Derive expected target/result independently of the code being changed. For a
failure, minimize the config/message/runtime/artifact tuple and probe one cause
before patching; remove only edits motivated by a rejected cause.

Read package scripts before `core:runtime`, `core:import`, builds or browser
suites: they may download, compile or create large artifacts. Check resources and
clean only newly owned disposable outputs. Report unavailable engines/artifacts
and actual results separately. Store listing/publish readiness and publication
are distinct from a tested local extension package.
