---
order: 9
group: Elixir & OTP
title: WoTEx
lede: OTP-native Elixir libraries that bring the W3C Web of Things to the BEAM.
repositories: []
links:
  - label: GitHub organization
    href: https://github.com/wotex-project
---

An open-source family of focused Elixir libraries for the W3C Web of Things and the edge-to-cloud continuum. IoT remains fragmented across vendors, protocols, and incompatible data models, so every product repeats the same description, discovery, and binding work and interoperability stays a promise on a diagram. **WoTEx** supplies shared terminology and contracts for describing a Thing's properties, actions, and events, validating Thing Descriptions, connecting protocol bindings, discovering Things, composing caller-owned runtimes, and keeping behavior consistent from cloud services to disconnected edge devices, with conformance testing against the published specifications and room for machine learning close to the device.

Each library follows OTP conventions: independently useful, explicit about ownership, and passive until the consuming application starts it. Nothing imposes a database, supervision tree, web framework, or proprietary platform on the host. The aim is shared infrastructure for the Elixir, Nerves, and industrial IoT communities, open enough to adopt without inheriting a platform and extensible toward future protocols and edge intelligence.
