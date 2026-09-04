# Contributing

Focused fixes to the open-source application code are welcome. This repository is the
production source for a personal editorial site, so a change must serve the deployed
showcase rather than turn it into a general template or component library.

## Before proposing a change

Use a GitHub issue for reproducible bugs, accessibility problems and narrowly scoped
improvements. Security reports must follow [SECURITY.md](SECURITY.md) and must never
be filed publicly.

Editorial copy, project selection, visual identity and logo changes are
maintainer-controlled. Open an issue before spending time on changes to material
excluded by [LICENSE.md](LICENSE.md).

## Development requirements

- Use pnpm and commit the lockfile when dependencies change.
- Write TypeScript; do not add authored JavaScript files.
- Use Svelte 5 runes and callback props for new interactive components.
- Name Svelte files in kebab case and avoid barrel modules.
- Use Tailwind theme tokens and utilities; do not add a UI component library.
- Keep source compatible with strict Biome and TypeScript checks.
- Add the smallest test that demonstrates the changed behaviour.

Run the full verification sequence before opening a pull request:

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm test:all
pnpm storybook:build
pnpm build
```

## Contribution terms

By intentionally submitting a code contribution, you agree that it may be distributed
under the MIT terms in [LICENSE.md](LICENSE.md). Do not submit material you are not
authorised to license, confidential information, credentials, customer data or
unpublished project details.

Participation is governed by [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Submission does
not guarantee acceptance, publication or ongoing support.
