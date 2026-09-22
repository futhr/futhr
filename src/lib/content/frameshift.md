---
order: 14
group: Research
title: Frameshift
lede: Experimental, local-first research into thin digital art frames that keep the artwork visible and the control plane out of sight.
repositories:
  - futhr/frameshift
links:
  - label: Repository
    href: https://github.com/futhr/frameshift
---

Digital art usually arrives as a screen, a dashboard, or a cloud service rather than an object that behaves like framed artwork. **Frameshift** researches three thin still-image reference media—reflective color e-paper, matte LCD, and low-resolution RGB matrix—under the same capability-driven protocol. A minimal macOS menu-bar host keeps source masters and rendering work local, prepares exact artifacts for each frame, and lets the display retain its last verified image without a mandatory vendor cloud, account, or subscription.

The architecture separates the Elixir/OTP host, SwiftUI shell, Zig rendering and firmware, and autonomous frame agents so physical constraints can be tested without turning one display or vendor into the platform. Paper, photo, and pixel frames remain research targets; power, thermals, mounting, protocol behavior, and hardware choices advance only through documented prototypes and measurements.

*Digital art presented as an object, not another screen to manage.*
