# futhr

Generating code is getting cheaper. Deciding what should exist, defining its
boundaries, and checking whether it works still take judgement. The work here
starts with those questions. Agents help with implementation; architecture,
review, and release decisions remain human responsibilities.

*Fast is now table stakes. Fast and correct is the edge.*

## Thesis

Trust, interoperability, and unit economics shape the architecture. A model
can propose an action; explicit contracts, durable state, and policy determine
whether the system can carry it out and recover when it fails.

The libraries isolate recurring problems: booking rules, notification
templates, API descriptions, credential generation, tool authority, payment
and shipping state, and interface interchange. Each has a defined boundary
with the application that uses it. Tests and formal checks establish specific
properties within that boundary; a consuming product still needs its own
validation.

## The work

- **Elixir and OTP:** application libraries, agent security, and Web of Things
  infrastructure. Each package documents its runtime and supervision needs.
- **Ruby and Solidus:** payment and shipping extensions for existing shops.
- **Rust:** NUIF research into interface interchange and measurable conversion
  loss.
- **Ventures and research:** Refpath, Rivure, Reloved, Orvane, Diggymon, and Äger.
  The showcase describes their direction; it does not offer released products.

## Method

Write the intent and constraints before implementation. Keep decisions
replayable where possible, with time and external effects passed through
explicit boundaries. Record uncertain outcomes so recovery has a starting
point. Review generated code against the same requirements as any other code.

Documentation, contracts, and tests belong beside the implementation. Claims
should name what was checked and where the evidence stops.

*Bootstrapped by default, built for durable ownership.*

## This repository

This is the production source for [futhr.io](https://futhr.io/), a SvelteKit
showcase, and the separate venture waitlist Workers in
[apps/waitlist](apps/waitlist/README.md). Development commands and architecture
are indexed in [docs/README.md](docs/README.md); contributions follow
[CONTRIBUTING.md](CONTRIBUTING.md).

The site links public libraries to their repositories and published
documentation. Agents can read the portfolio through
[llms.txt](https://futhr.io/llms.txt) or
[llms-full.txt](https://futhr.io/llms-full.txt).
