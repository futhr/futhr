---
name: showcase-voice
description: Editorial rules for every visible word on futhr.io. Use when writing or editing a showcase entry in src/lib/content, the thesis, footer strings, metadata copy in src/lib/config/site.ts, llms.txt text, or any public-facing prose in this repository. Covers voice, entry structure, link rules, disclosure limits, and the final editorial checks.
---

# Showcase voice

Every entry is one screen: a group label, a large product name, a one-sentence
ingress in the left column, a concept-and-vision description in the right column,
and at most a few quiet text links. The Markdown files in `src/lib/content/` are
the only copy of the approved text. Read the neighbouring entries before writing
a new one, and keep supplied copy intact unless a change improves grammar without
changing the claim.

## Voice

- Noun-led, product-centred. Describe what the project is. No creator narration,
  no first-person pronouns, no "we".
- Plain English, concrete nouns, active verbs, confident claims, specific category
  language. British or American spelling may not be mixed inside one entry.
- No emoji, empty hype, inflated scale claims, fake quotations, cute language, or
  hobby-project framing.
- Do not repeat the same technical point in the ingress and the description.
- Apply `unslop` as the final pass.

## Entry structure

| Field | Content |
|---|---|
| `title` | Display name with readable capitalisation. Exact repository names belong in `repositories`, not in the title. Use a soft hyphen (U+00AD) only when a long word must break in the headline. |
| `lede` | The pitch in one sentence: category, structural advantage, and the commercial or technical outcome. |
| body | The broken status quo, the differentiated model, and the expansion path, in that order, in one or two paragraphs. Then a closing line in italics on its own paragraph: a short punchline that lands the idea without repeating the ingress or the body. No release-status sentences; availability is handled by the waiting lists, not the copy. |
| `group` | One of the existing group names unless a new section is requested. Consecutive entries with the same group form one section. |
| `links` | See link rules. Label with the destination, for example `Repository`, `HexDocs`, `Visit Refpath`, `Talk`. |

## Link rules

- Public repositories link to GitHub. Published Hex packages also link to HexDocs.
  A project without a published package gets no documentation link.
- Venture entries link only to the public root domain or waiting-list page, never
  to GitHub, HexDocs, or a private repository. If no public domain resolves, the
  entry has no link.
- Never link to a page that would 404 or that reveals private source.

## Disclosure limits

- Never imply that private or pre-release software is available today. Use
  "pre-release", "in development", "planned", "being prepared for public release".
- Never reveal private architecture, customers, prospects, credentials, provider
  choices, internal dependencies, performance targets, build metrics, or
  cross-product relationships. Named third-party providers stay out unless the
  provider is the subject of a public integration, as with Solidus extensions.
- Proprietary repositories may be described only conceptually. Quote nothing from
  their source, specs, or business documents.
- Every visible claim must be supported by the repository README or marked as
  intent, research, development, planned, or pre-release. Repository counts,
  benchmarks, roadmap items, and README checklists are not marketing proof.

## Final checks

1. Ingress is one sentence and reads as the pitch on its own.
2. Description ends with a one-line italic punchline that repeats nothing above it.
3. Links obey the link rules and resolve.
4. `pnpm test:unit` passes; the content loader validates frontmatter and order.
5. Reread once for AI tells and cut them.
