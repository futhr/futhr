---
order: 5
group: Elixir & OTP
title: DocShell
lede: One versioned documentation artifact for every site, product surface, search index, and AI system.
repositories:
  - futhr/doc_shell
links:
  - label: Repository
    href: https://github.com/futhr/doc_shell
  - label: HexDocs
    href: https://hexdocs.pm/doc_shell/
---

A renderer-neutral documentation pipeline that turns Elixir module docs, Markdown guides, Livebooks, changelogs, and OpenAPI material into a versioned JSON contract. The same artifact can drive a documentation site, embedded help, search, knowledge graphs, and AI retrieval without rebuilding the source for each channel. Generation identity prevents mixed releases, while rendering and access policy stay with the consuming product. **DocShell** converts documentation from a site-specific build output into portable product infrastructure.
