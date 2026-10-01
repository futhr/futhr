---
name: editorial
description: Write or review public-facing portfolio copy, showcase entries, waitlist or landing strings, and generated metadata. Use when changing product claims, entry structure, public links, or release-status wording. Technical documentation and chat use the prose rules in AGENTS.md.
user-invocable: false
---

# Editorial copy

## Inputs and output

Read the requested copy, neighbouring entries, and the relevant project's public
README or approved facts. Produce edits in the existing copy owner and report
unsupported claims or destination problems in chat. Preserve supplied copy unless
the request calls for rewriting or a correction leaves its meaning intact.

Copy owners depend on the surface:

- Showcase entries: [src/lib/content/](../../../src/lib/content/).
- Showcase identity, footer, and metadata: [site.ts](../../../src/lib/config/site.ts).
- Waitlist identity: [brands.ts](../../../apps/waitlist/src/lib/brands/brands.ts);
  shared UI strings: [strings.ts](../../../apps/waitlist/src/lib/brands/strings.ts).
- Landing identity: [projects.ts](../../../apps/landing/src/lib/projects.ts);
  shared UI strings: [strings.ts](../../../apps/landing/src/lib/strings.ts).

Read only the owners and project sources relevant to the changed surface. Keep
technical and legal wording precise; these rules do not authorize changing
privacy notices or consent terms to improve a pitch.

## Voice and claims

- Lead with the product and what it is. Use concrete nouns, active verbs, and
  specific category language. Avoid creator narration, first-person pronouns,
  empty hype, inflated scale claims, fake quotations, and hobby-project framing.
- Keep spelling consistent within an entry. Preserve product, package, group,
  and repository names exactly. Do not turn infrastructure libraries into SaaS
  copy or ventures into hobby projects.
- Do not repeat a technical point in both the lede and body. Cut stock transitions,
  forced triads, hedge stacks, vague authority, and decorative emphasis when they
  add no meaning. Prefer a direct sentence to an empty tail such as "ensuring
  reliability". Keep terms that carry a specific technical meaning.
- Support public claims with the relevant public README or approved facts.
  Identify intent, research, development, planned work, or pre-release status as
  such. Counts, benchmarks, roadmap items, and README checklists alone do not
  establish a marketing claim.
- Do not imply that private or pre-release software is available today. Use the
  applicable status vocabulary: "pre-release", "in development", "planned", or
  "being prepared for public release". Entry bodies describe the concept; release
  details belong on the appropriate availability surface.
- Keep private architecture, customers, prospects, credentials, provider choices,
  internal dependencies, performance targets, build metrics, and cross-product
  relationships out of public copy. Name a third-party provider only when it is
  the subject of a public integration, such as a Solidus extension.
- Write "waitlist" as one word.

## Showcase entries

Apply this format only to Markdown entries, not metadata or form instructions.
The composition is a group label, headline, one-sentence lede, compact body, and
quiet text links. Keep the established screen-length composition.

| Field | Content |
| --- | --- |
| `title` | Readable display name. Put exact repository names in `repositories`. Use U+00AD only for a deliberate headline break. |
| `lede` | A single-sentence pitch explaining the category, structural advantage, and outcome. |
| body | Explain the problem, differentiated model, and expansion path where supported. End with a separate italic closing line that adds an idea rather than repeating the lede. |
| `group` | An existing group unless a new section was requested; consecutive matching groups form one section. |
| `links` | Quiet destination labels such as `Repository`, `HexDocs`, or `Talk`. |

## Public links

- Link public repositories to GitHub. Add HexDocs only for a published Hex
  package; an unpublished package gets no documentation link.
- Venture entries link to the public root domain or waitlist, never private source,
  GitHub, or HexDocs. Keep approved destinations during DNS or server setup.
- Report a failed availability check for review. A timeout or pending deployment
  does not justify deleting an approved destination.

## Review and verification

Reread the changed prose for unsupported claims, repeated ideas, and loss of
technical meaning. Check entry closing lines and public-link rules where they
apply. For content changes, `pnpm test:unit` exercises the
[content loader](../../../src/lib/server/content.ts); it validates frontmatter,
ordering, and safe URLs, not the truth or tone of the prose. Use the affected
package's checks for waitlist or landing strings. Report actual results and the
editorial review separately.
