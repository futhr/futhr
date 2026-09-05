---
order: 2
group: Elixir & OTP
title: SigilGuard
lede: The in-process security runtime for autonomous agents touching production tools and data.
repositories:
  - refpath/sigil_guard
links:
  - label: Repository
    href: https://github.com/refpath/sigil_guard
  - label: HexDocs
    href: https://hexdocs.pm/sigil_guard/
---

An embedded Elixir enforcement layer between autonomous agents and production systems. Tool calls, returned data, and outbound transfers pass through deterministic policy before execution. Secret scanning, source-to-sink controls, pinned tool manifests, exact-action confirmation, signed attestations, and audit records turn agent authority into an inspectable security boundary. The decision path stays inside the host application, removing a network dependency from the point of enforcement. **SigilGuard** supplies the control layer required when probabilistic models gain access to consequential tools.
