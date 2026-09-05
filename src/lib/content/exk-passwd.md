---
order: 7
group: Elixir & OTP
title: ExkPasswd
lede: Memorable passphrases from independently chosen words, shaped by configuration the host owns.
repositories:
  - futhr/exk_passwd
links:
  - label: Repository
    href: https://github.com/futhr/exk_passwd
  - label: HexDocs
    href: https://hexdocs.pm/exk_passwd
---

A password generator built on a plain observation: a few independently chosen real words are easier to read, type, and remember than a short string of symbols, and length arrives naturally instead of through repetition. **ExkPasswd** turns that observation into a library with a public wordlist, strict configuration that rejects unknown, duplicate, or unsatisfiable options before anything is generated, and no runtime dependency beyond Erlang's own crypto module.

Every part of the shape belongs to the application: seven presets cover memorable defaults and compatibility constraints, custom UTF-8 dictionaries load at startup, transforms are a protocol with case handling, substitution, Pinyin, and Romaji built in, and a supervised registry composes named presets at runtime. Batch and parallel generation keep the same unbiased selection while cutting calls to the random source, and executable Livebook notebooks walk from the quick start to Chinese and Japanese dictionaries.

*Words you can remember, rules you can read.*
