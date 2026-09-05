---
order: 6
group: Elixir & OTP
title: AshOaskit
lede: OpenAPI 3.0 and 3.1 generated directly from the Ash domain model.
repositories:
  - futhr/ash_oaskit
links:
  - label: Repository
    href: https://github.com/futhr/ash_oaskit
  - label: HexDocs
    href: https://hexdocs.pm/ash_oaskit
---

An API-contract generator that removes the second schema usually maintained beside an Ash application. Public resources, AshJsonApi routes, types, and constraints produce an OpenAPI 3.0 or 3.1 specification for validation, export, documentation, and client generation. Private fields stay private by default. **AshOaskit** makes the application domain the source of truth for both runtime behavior and external API description, reducing contract drift while keeping compatibility explicit.
