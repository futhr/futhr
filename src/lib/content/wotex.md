---
order: 2
group: Elixir & OTP
title: WoTEx
kerning:
  oT: -0.1
lede: OTP-native Elixir libraries that bring the W3C Web of Things to the BEAM.
repositories:
  - wotex-project/wotex
  - wotex-project/wotex-home
  - wotex-project/wotex-tracker
links:
  - label: Repository
    href: https://github.com/wotex-project/wotex
  - label: WoTEx Home
    href: https://github.com/wotex-project/wotex-home
  - label: WoTEx Tracker
    href: https://github.com/wotex-project/wotex-tracker
---

Connected products still repeat the work of describing devices, discovering them, and binding incompatible protocols. WoTEx develops focused Elixir libraries for W3C Thing Descriptions, interactions, bindings, and discovery across cloud and edge runtimes. Each library follows OTP conventions and stays independently useful: *the host application owns its supervision tree, storage, and protocol clients*.

Conformance tests tie the shared contracts to published specifications. Two experimental applications put the libraries under real use: WoTEx Home, a local home controller that separates a requested change from a confirmed physical result, and WoTEx Tracker, a self-hosted asset tracker that turns tracker and sensor evidence into validated Thing Descriptions.

*One standard for Things, and a runtime built to keep them running.*
