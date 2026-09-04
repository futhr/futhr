---
name: git-commit
description: Commit message and git operation rules for this repository. Single-line conventional subject, no body, no trailers, no co-author or tool attribution. Use before every git commit, when reviewing history, or when asked about commit conventions.
---

# Git commit rules

## Message

Exactly one line:

```
<type>: <subject>
```

- `type` is one of: `feat`, `fix`, `content`, `style`, `docs`, `test`, `refactor`,
  `perf`, `build`, `ci`, `chore`.
- `subject` is imperative mood, lower-case first letter, no trailing period, at
  most 72 characters for the whole line.
- No scope parentheses, no `!`, no emoji, no ticket numbers, no URLs.
- No body. No trailers of any kind: no `Co-Authored-By`, `Signed-off-by`,
  `Generated with`, or session identifiers. Authorship is the git author only.
  `.claude/settings.json` sets `attribution` to empty for the same reason.

Examples: `content: add the WoTEx entry under Elixir & OTP`,
`style: match collapsed row height to the reference`,
`fix: scroll instantly while a row opens`.

## Operations

- One logical change per commit. Split content edits from component edits.
- Commit only when the maintainer asks. Never push unless asked. Never
  force-push `main`. Never rewrite published history.
- Do not stage `build/`, `storybook-static/`, `coverage/`, `test-results/`,
  `node_modules/`, or editor state.
- Run `pnpm quality` and `pnpm check` before any commit. Run the affected test
  suite from `AGENTS.md` before a commit that touches components or content.
