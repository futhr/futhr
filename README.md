# futhr

Code just became cheap. For the first time in the history of the craft,
producing software costs almost nothing. What it costs to be right has not moved
an inch.

That is the whole opportunity. When generation is free, every hour shifts to the
questions that were always the hard ones: what should exist, where the
boundaries go, which invariants hold under load, what happens when the model on
the other side of the tool call is wrong. Decades of building distributed
systems turn out to be exactly the preparation for a world where the typing is
done by something else.

The method is simple. Intent is written down before the first token lands.
Agents produce the volume; the architecture, the review, and the verdict stay
human. Correctness is proven where the stakes justify proof, tested where they
don’t, and enforced at the boundary between a model and the tools it can reach.
The result moves at machine speed and holds to a standard most teams stopped
enforcing years ago.

*Fast is now table stakes. Fast and correct is the edge.*

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

## What is here

One founder-engineer in Gothenburg builds and runs all of it: the libraries, the
companies on top of them, and the method above that lets one person carry both.
Bootstrapped by default, built for durable ownership.

- **Elixir and OTP** carry the core. Every library follows OTP conventions:
  passive until the host starts it, explicit about what it owns, replayable
  where it decides. This is where the thesis is worked out first.
- **Ruby and Solidus** is a separate line, unrelated to the rest by design:
  payment and shipping extensions for shops that already run on Solidus.
  Commerce state is a boundary worth solving once, in the language the shops
  speak.
- **Rust** is the engine language where determinism and speed both matter. Most
  of that work sits inside the products; NUIF, the interface interchange format,
  is the part published as research.
- **The ventures** are the commercial layer: Refpath, Rivure, Reloved, Orvane,
  Diggymon, and Äger. Each is described on futhr.io as intent, never as
  availability.

## Method

- **Intent first.** Specifications, contracts, and tests exist before an agent
  writes a line. Output is judged against them, never the other way round.
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

[futhr.io](https://futhr.io/) lists everything current, grouped by runtime,
venture, and talk, and links each open library to its repository on GitHub and
its documentation on HexDocs. The pinned repositories below follow the same
selection. Agents can read the same material as
[llms.txt](https://futhr.io/llms.txt) or
[llms-full.txt](https://futhr.io/llms-full.txt).
