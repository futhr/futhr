# futhr

Open-source infrastructure for software where decisions carry operational,
financial, or legal weight. Elixir and OTP first, Ruby where commerce already
lives, Rust where the research needs a deterministic engine.

## Thesis

**Trust, interoperability, and unit economics are architectural constraints,
not features added after scale.** Probabilistic intelligence belongs above a
deterministic foundation of durable state, explicit contracts, verification, and
recovery. A library that gets this right is small, replayable, and honest about
what it does not own; a product built on such libraries keeps its own data,
its own failure modes, and its own economics.

The open-source cores are where that discipline compounds. Each one isolates a
boundary that every serious application pays for again and again: booking
rules, notification templates, API contracts, credential generation, agent
authority, payment and shipping state, interface interchange. Solve the boundary
once, in the open, and every product on top of it inherits the proof.

## Method

- **Deterministic cores.** Decisions are pure and replayable. Time, randomness,
  and providers enter through explicit inputs, never through a hidden clock or a
  global.
- **Explicit ownership.** A library owns no database, supervision tree, web
  framework, or deployment. It is passive until the host starts it, and the host
  stays the system of record.
- **Failure has a state.** Ambiguous outcomes, uncertain responses, and
  unverified results are modelled, not retried blindly or waved through.
  Uncertainty never becomes permission.
- **Contracts over conventions.** Types, schemas, manifests, and conformance
  suites carry the agreement between components, so drift shows up in a build,
  not in production.
- **Evidence gates.** Formal checks, unbiased sampling, signed attestations,
  exact-decimal money. Claims are backed by something that can be run.
- **Documentation as an artifact.** Docs are versioned output of the same build
  that produces the code, portable to any site, search index, or agent.

## Where the work is

[futhr.io](https://futhr.io/) lists everything current, grouped by runtime, and
links each entry to its repository on GitHub and its documentation on HexDocs.
The pinned repositories below follow the same selection. Agents can read the
same material as [llms.txt](https://futhr.io/llms.txt) or
[llms-full.txt](https://futhr.io/llms-full.txt).
