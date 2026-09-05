---
order: 5
group: Elixir & OTP
title: Letterpress
lede: A compile-time trust boundary for notification templates on the BEAM.
repositories:
  - futhr/letterpress
links:
  - label: Repository
    href: https://github.com/futhr/letterpress
  - label: HexDocs
    href: https://hexdocs.pm/letterpress
---

A notification compiler that moves template risk out of delivery time. Restricted MJML and Liquid become immutable, typed artifacts before reaching production, and runtime nodes render them in pure BEAM code without Node.js or an editor in the delivery path. **Publication remains an explicit application decision.** Syntax errors, unsafe behavior, and incompatible changes surface during authoring and review, while the artifact contract keeps every delivered message inspectable, versioned, and reproducible.
