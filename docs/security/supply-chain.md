# Software supply-chain policy

## Dependency controls

- pnpm is the only package manager for this repository.
- The package-manager version and Node.js floor are declared in `package.json`.
- `pnpm-lock.yaml` is committed and CI installs it with `--frozen-lockfile`.
- Direct dependencies are reviewed before addition; unused packages are removed.
- Dependency updates are made deliberately by the maintainer, not by automated
  update bots. Dependabot version updates and automated security fixes are off.
- Newly published packages remain subject to pnpm's release-age policy.
- The PostCSS override is an explicit temporary compatibility and supply-chain
  decision, not an implicit transitive resolution.

## Verification

Every releasable change must pass strict Biome checks, Svelte and TypeScript
diagnostics, unit tests, headless browser tests, and a production static build.
Security-sensitive dependency findings are triaged under `SECURITY.md` rather
than being waived silently.

## Release evidence

Keep the source commit, lockfile, CI result, generated artifact identity, and any
security exceptions together. A dependency inventory can be reviewed with:

```sh
pnpm list --depth Infinity
pnpm licenses list --json
pnpm audit
```

An inventory is not by itself a product-specific SBOM or a legal compliance record.
Any future distributed product requires its own reviewed evidence and obligations.
