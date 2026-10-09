---
order: 3
group: Elixir & OTP
title: ExMaude
lede: Elixir bindings for Maude that search the paths a model allows, not only the one a test happened to run.
repositories:
  - futhr/ex_maude
links:
  - label: Repository
    href: https://github.com/futhr/ex_maude
  - label: HexDocs
    href: https://hexdocs.pm/ex_maude
---

Automation rules, agent policies, and concurrent workflows fail through combinations that ordinary tests rarely reach. ExMaude connects Elixir applications to the Maude rewriting-logic system through a pool of port-based workers, exposing term reduction, rewriting, and state-space search with structured results and telemetry. Modules for IoT automation rules and AI agent policies detect conflicts in capability, authority, approval, and overlapping rules against an explicit model.

Maude treats states as terms and behavior as rewrite rules, so a question becomes *whether a state is reachable under any valid sequence of rule applications*. Ordinary application logic stays in Elixir, and each result holds only for what the model represents.

*Not what happened, but what could.*
