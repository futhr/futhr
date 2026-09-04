---
order: 12
group: Ruby & Solidus
title: Nexi
lede: Verified Nexi payment state for Solidus beyond redirects and webhook guesswork.
repositories:
  - futhr/solidus_nexi
links:
  - label: Repository
    href: https://github.com/futhr/solidus_nexi
---

A Nexi Checkout integration built around authoritative payment state. Card and wallet data stay in the hosted checkout, while Solidus stores provider identifiers and financial outcomes verified at the source. Redirects and webhooks trigger retrieval instead of being accepted as proof. Authorization, capture, cancellation, refund, duplicate delivery, and uncertain responses each have an explicit state and recovery path. The operation set stays intentionally bounded to behavior the integration can model honestly. *The extension is installed from the repository and not yet published as a gem.*
