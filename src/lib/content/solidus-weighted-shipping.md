---
order: 10
group: Ruby & Solidus
title: Weighted Shipping
lede: Instant, exact weight-based shipping from rules the merchant owns.
repositories:
  - futhr/solidus-weighted-shipping
links:
  - label: Repository
    href: https://github.com/futhr/solidus-weighted-shipping
---

A Solidus shipping calculator for merchants whose delivery economics fit explicit weight rules. Exact-decimal rates cover bands, parcel overflow, handling, free-shipping thresholds, and item constraints without a carrier account or network request. Invalid configuration and missing weights fail visibly instead of generating a plausible but wrong checkout price. The merchant owns a fast, testable pricing model that remains understandable as rates change. *The 4.0 rewrite is installed from the repository and not yet published as a gem.*
