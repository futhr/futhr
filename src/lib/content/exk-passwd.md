---
order: 8
group: Elixir & OTP
title: ExkPasswd
lede: Memorable passphrases from independently chosen words, shaped by configuration the host owns.
repositories:
  - futhr/exk_passwd
links:
  - label: Generate passwords
    href: /exk-passwd/
  - label: Repository
    href: https://github.com/futhr/exk_passwd
  - label: HexDocs
    href: https://hexdocs.pm/exk_passwd
---

Short strings of symbols are hard to remember. ExkPasswd builds passphrases from **independently chosen words**, with a public wordlist and strict configuration that rejects invalid or impossible rules before generation. Erlang's crypto module is its only runtime dependency.

Applications can choose from seven presets, load UTF-8 dictionaries, and compose transforms for case, substitution, Pinyin, or Romaji. A supervised registry exposes named presets at runtime; batch generation preserves unbiased selection while reducing calls to the random source. Livebook notebooks cover the basics and multilingual dictionaries.

*Words you can remember, rules you can read.*
