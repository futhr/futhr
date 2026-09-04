@AGENTS.md

## Claude Code

Skills under `.claude/skills/` are selected automatically from their
descriptions. Do not wait for a slash command.

- `showcase-voice` for any visible copy: content entries, site strings, metadata.
- `unslop` as the final pass over every piece of persisted prose.
- `svelte-kit` when touching `.svelte` files, routes, tests, or stories.
- `git-commit` before any commit.
- `terse-chat` for replies to the maintainer.

## Hard rules

1. Visual changes are measured, not eyeballed: screenshot at 1440px, compare
   positions and line breaks with the reference, and report the numbers that
   differ.
2. No hooks, scripts, or automation added to `.claude/`. Settings stay limited to
   attribution and permissions.
3. Do not add entries, groups, dependencies, or components beyond the request.
4. Proprietary repositories are described conceptually only; never quote their
   source or internal documents into this repo.
5. Report outcomes faithfully. If a suite was not run, say so.
