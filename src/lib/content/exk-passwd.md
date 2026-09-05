---
order: 7
group: Elixir & OTP
title: ExkPasswd
lede: Human-readable passphrases with measurable, generator-aware entropy.
repositories:
  - futhr/exk_passwd
links:
  - label: Repository
    href: https://github.com/futhr/exk_passwd
  - label: HexDocs
    href: https://hexdocs.pm/exk_passwd
---

A password generator for products that need memorable credentials and a defensible security calculation. Independent cryptographic word selection, explicit transformations, and rejection sampling protect the distribution from hidden bias. Entropy estimates follow the output space the configured generator can actually reach, including custom dictionaries and added characters. **ExkPasswd** makes human usability compatible with measurable security instead of treating complexity rules as proof.
