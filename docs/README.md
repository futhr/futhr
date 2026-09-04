# Documentation index

Every Markdown document in this repository, grouped by where it lives and what it
is for. Editorial copy is not documentation; it lives in `src/lib/content/` and is
served by the site.

## docs/

### architecture/

| Document | Purpose | Status |
| --- | --- | --- |
| [cloudflare.md](architecture/cloudflare.md) | Deployment guide: Workers static assets for the site and Storybook, headers and CSP, custom domains and TLS, deploys from GitHub Actions or Workers Builds, API token scoping, limits, and the migration from Pages. | Current guide |
| [waitlist-platform.md](architecture/waitlist-platform.md) | Recommended architecture for a multi-brand waitlist platform beside the static site. | Proposal, not implemented |

### legal/

| Document | Purpose | Status |
| --- | --- | --- |
| [accessibility.md](legal/accessibility.md) | Accessibility statement: WCAG 2.2 AA target, measures in place, how to report a barrier. | Dated statement |
| [privacy.md](legal/privacy.md) | Privacy information for a static site with no accounts, forms, analytics, or cookies. | Dated statement, update before adding processors |

### security/

| Document | Purpose | Status |
| --- | --- | --- |
| [supply-chain.md](security/supply-chain.md) | Supply-chain policy: package manager, lockfile, dependency review, verification gates, release evidence. | Policy |

## Repository root

| Document | Purpose |
| --- | --- |
| [README.md](../README.md) | GitHub profile page: thesis, ventures, libraries, research, talks. |
| [docs/development.md](development.md) | Technical overview, layout, content model, commands, build and Storybook. |
| [AGENTS.md](../AGENTS.md) | Canonical contract for coding agents: what the repo is, commands, structure, conventions, definition of done. |
| [CLAUDE.md](../CLAUDE.md) | Claude Code entry point; imports AGENTS.md and adds skill selection and hard rules. |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Scope of welcome changes, development requirements, verification sequence, contribution terms. |
| [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) | Participation rules. |
| [SECURITY.md](../SECURITY.md) | Supported version, private vulnerability reporting, handling. |
| [SUPPORT.md](../SUPPORT.md) | Where questions and defects go. |
| [POLICIES.md](../POLICIES.md) | Navigation aid across the community, licensing, and site statements. |
| [LICENSE.md](../LICENSE.md) | MIT for application code; excluded editorial copy and marks. |
| [TRADEMARKS.md](../TRADEMARKS.md) | Names and marks. |
| [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md) | Third-party licences, including the Archivo font. |

## Agent skills (`.claude/skills/`)

| Skill | Purpose |
| --- | --- |
| [showcase-voice](../.claude/skills/showcase-voice/SKILL.md) | Editorial rules for every visible word: voice, entry structure, link rules, disclosure limits, final checks. |
| [unslop](../.claude/skills/unslop/SKILL.md) | Cuts AI tells from prose while keeping technical precision. |
| [svelte-kit](../.claude/skills/svelte-kit/SKILL.md) | Svelte 5 and SvelteKit rules for this codebase, with the lint and parser traps that bite here. |
| [git-commit](../.claude/skills/git-commit/SKILL.md) | One-line commit subjects, no trailers, no attribution, operational rules. |
| [terse-chat](../.claude/skills/terse-chat/SKILL.md) | Compressed reply register for conversation with the maintainer. |

## Generated for agents at build time

Served by the site, not stored as files: `/agents.md` (AGENTS.md verbatim),
`/agents/stack.md` (pinned versions from `package.json`), `/llms.txt`,
`/llms-full.txt`, and `/work/<slug>.md` per entry. The generators are in
`src/lib/server/agent-documents.ts`.
