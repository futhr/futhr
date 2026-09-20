# Browser-core reproducibility

Measured on 20 September 2026 from two separate source copies. Each copy
excluded build products and dependencies, then ran `browser/scripts/build-core.sh`
in a fresh `hexpm/elixir:1.17.3-erlang-26.0.2-alpine-3.20.3` container.

Both `bundle.avm` files were 7,273,704 bytes, but they were not byte-identical:

| Build | SHA-256 |
| --- | --- |
| A | `cbac4368d521ff1636be0d17eabf5564ae58080d6759ac62fd7ae87a585c41fd` |
| B | `2b1167284852cc34e9b154a1443949a1e37413d066557cd33ae2c9088cd1be92` |

`cmp -l` reported 66 differing byte positions. The first difference was at
byte 13,936, where the AVM files serialised Logger compile-time configuration
terms such as `metadata` and `discard_threshold_periodic_check` in different
orders. This suggests nondeterministic term ordering in the upstream build
path; it does not establish the complete cause.

The release is therefore **not claimed to be reproducible**. `manifest.json`
and `SHA256SUMS` identify the exact browser-core bytes consumed by the site and
extensions. Re-run this measurement after changes to Elixir, OTP, Popcorn, or
the AtomVM packaging path.
