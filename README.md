# futhr

Generating code keeps getting cheaper. Deciding what should exist, where its
boundaries lie, and whether it works still takes judgement, and the work here
starts with those decisions. Agents help with implementation. Architecture,
review, and release decisions stay with people.

*Fast is the baseline now. Fast and correct is the advantage.*

## Thesis

Trust, interoperability, and unit economics shape the architecture. A model
can propose an action. Explicit contracts, durable state, and policy decide
whether the system carries it out and how it recovers when the action fails.

Each library takes on one recurring problem and has a defined boundary with
the application that uses it. Tests and formal checks establish specific
properties inside that boundary. A product that uses a library still needs its
own validation.

## Method

Write down intent and constraints before the implementation. Keep decisions
replayable where possible by passing time and external effects in through
explicit boundaries. When an outcome is uncertain, record it, so recovery has
somewhere to start. Hold generated code to the same requirements as any other
code.

Documentation, contracts, and tests live beside the implementation. A claim
names what was checked and where the evidence stops.

*Bootstrapped by default, built for durable ownership.*
