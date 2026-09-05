---
order: 12
group: Ruby & Solidus
title: nShift
lede: Recoverable nShift shipping operations for Solidus, from checkout selection through tracking.
repositories:
  - futhr/solidus_nshift
links:
  - label: Repository
    href: https://github.com/futhr/solidus_nshift
---

A shipping operations layer connecting Solidus checkout, delivery options, service points, booking, labels, cancellation, and tracking to nShift. Every shipment mutation is recorded before dispatch, preserving intent when a provider succeeds behind a failed connection. Ambiguous outcomes enter reconciliation instead of blind retry, and operators retain a clear history of each attempt. Solidus remains the system of record for orders and fulfillment. The extension makes failure recovery part of the shipping model rather than an emergency process after money and parcels are already moving. *It is installed from the repository and not yet published as a gem.*
