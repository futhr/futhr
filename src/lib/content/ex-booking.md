---
order: 3
group: Elixir & OTP
title: ExBooking
lede: Deterministic booking infrastructure that embeds without taking over the application.
repositories:
  - futhr/ex_booking
links:
  - label: Repository
    href: https://github.com/futhr/ex_booking
  - label: HexDocs
    href: https://hexdocs.pm/ex_booking
---

A pure decision engine for products that need booking logic without adopting a booking platform. Availability, time zones, daylight-saving boundaries, capacity, resource assignment, validation, and lifecycle decisions remain deterministic and replayable. **ExBooking** owns no processes, providers, persistence, or hidden clock, leaving the host in control of customer data, payments, notifications, and experience. The library turns the hardest scheduling rules into a small, testable core that can support many vertical products without forcing them into one operating model.

*The rules of scheduling, without the platform.*
