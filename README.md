# Tobias Bohwalli / futhr

Founder building a capital-efficient portfolio of platforms and open
infrastructure for domains where software decisions carry operational,
financial, or legal consequences.

My thesis is that trust, interoperability, and unit economics are architectural
constraints—not features added after scale. Across the portfolio, probabilistic
intelligence sits above a deterministic foundation of durable state, explicit
contracts, verification, and recovery. I design the full loop: domain model,
runtime, product, distribution, and operating model. Shared open-source cores
compound engineering leverage and preserve customer control; commercial
platforms monetize operation, assurance, and domain outcomes.

Bootstrapped by default, built for durable ownership.

## Speaking at Goatmire 2026

Goatmire is a small, single-track gathering for the Elixir and BEAM community
in Varberg, Sweden, combining NervesConf EU with talks and hands-on workshops.

### [Zero Alert Storms: Formal Verification for IoT Automation](https://goatmire.com/talk/zero-alert-storms-formal-verification-for-iot-automation)

**September 30 at 16:00 · Varbergs Teater, Sweden**

Two automation rules can be reasonable in isolation and dangerous in
composition. At Goatmire, I’ll make them fight inside a simulated AGV
warehouse—then stop the same conflict before either rule can run.

The live demo uses [ExMaude](https://github.com/futhr/ex_maude) to check the
exact rule representation executed by the BEAM runtime. It preserves three
distinct outcomes—`clean`, `conflicts`, and `unverified`—because “the verifier
could not answer” must never become permission to deploy. AI explains the
evidence; Maude makes the decision.

[Explore the executable demo](https://github.com/futhr/goatmire-2026)

## Elixir and OTP libraries

- [SigilGuard](https://github.com/refpath/sigil_guard) — an embedded security
  runtime for MCP and agent-tool boundaries, with deterministic policy
  enforcement and signed, tamper-evident evidence.
- [ExBooking](https://github.com/futhr/ex_booking) — pure, replayable booking
  decisions for availability, assignment, and lifecycle events—with no
  database, providers, or hidden clock.
- [DocShell](https://github.com/futhr/doc_shell) — extracts Elixir documentation,
  guides, Livebooks, changelogs, and OpenAPI into versioned, renderer-neutral
  JSON artifacts.
- [Letterpress](https://github.com/futhr/letterpress) — compiles typed MJML and
  Liquid into immutable artifacts, then renders them safely in pure BEAM code.
- [AshOaskit](https://github.com/futhr/ash_oaskit) — derives validated OpenAPI
  3.0 and 3.1 documents from Ash resources and AshJsonApi routes.
- [ExkPasswd](https://github.com/futhr/exk_passwd) — memorable passphrases from
  unbiased cryptographic sampling, with generator-aware entropy analysis.
- [Phoenix Assets](https://github.com/futhr/phoenix-assets) — an opinionated,
  OTP-supervised SvelteKit stack with generated TypeScript contracts and a
  verifiable Phoenix asset graph.

## Solidus extensions

I maintain focused Solidus infrastructure for pricing, payments, and
fulfillment, with exact arithmetic and recoverable provider boundaries:

- [Solidus Weighted Shipping](https://github.com/futhr/solidus-weighted-shipping)
  — local, exact-decimal package pricing from merchant-defined weight bands,
  without carrier accounts or network calls.
- [Solidus Nexi](https://github.com/futhr/solidus_nexi) — hosted Nexi Checkout
  with authenticated webhooks and provider-verified financial state; the store
  never handles card or wallet details.
- [Solidus nShift](https://github.com/futhr/solidus_nshift) — nShift checkout and
  fulfillment with durable operation history and reconciliation for uncertain
  provider outcomes.

## Rust

- [NUIF](https://github.com/refpath/nuif) — an open research system for moving
  editable interfaces across tools while preserving intent and identity—and
  accounting explicitly for every lossy conversion.
