---
order: 20
group: Conf talks
title: Zero alert storms
lede: Formal verification for IoT automation, presented at Goatmire 2026 in Varberg, Sweden.
repositories:
  - futhr/goatmire-2026
links:
  - label: Talk
    href: https://goatmire.com/talk/zero-alert-storms-formal-verification-for-iot-automation
  - label: Repository
    href: https://github.com/futhr/goatmire-2026
---

Two automation rules can be reasonable in isolation and dangerous in composition. The talk makes them *fight* inside a simulated AGV warehouse, then stops the same conflict before either rule can run. One rule representation feeds both the Maude verifier and the BEAM runtime, reducing divergence between checked policy and executed behavior.

The gate distinguishes verified safety, discovered conflict, and an unverified result; uncertainty never becomes permission. Its value is a concrete deployment pattern for automation systems whose individual rules become dangerous in combination.

*Goatmire 2026 is conference material and simulation evidence, not a physical-fleet benchmark or production claim.*
