---
name: worker-boundary
description: "Implement, diagnose or review waitlist or landing Worker host routing, static assets, admin access, consent or withdrawal state. Follow exact hostname and identity boundaries through the Workers; skip showcase copy and unrelated styling."
user-invocable: false
---

# Change a Worker boundary

Select the application first. Read the
[waitlist operating guide](../../../apps/waitlist/README.md) or
[landing guide](../../../apps/landing/README.md) and the affected package's
scripts/configuration. The showcase is static; the landing is stateless; public
waitlist collection and private administration have different authority.

Trace an actual request before changing a handler:

- Landing: the [outer Worker](../../../apps/landing/src/worker.ts) resolves the
  exact host before SvelteKit or `ASSETS.fetch`. Test HTML and static assets for
  unknown hosts, aliases, www and HTTP redirects; build-only adapter config is
  not the production entrypoint.
- Public waitlist: hostname determines the closed brand identity. Preserve the
  server form action without JavaScript, input/rate/honeypot checks and consent
  recording. The page must not silently send email or invoke AI.
- Admin/withdrawal: follow
  [the admin entry](../../../apps/waitlist/src/admin-worker.ts) into Access JWT,
  grant and D1 owners. Reviewer metadata access is not address/deletion authority.
  Bind the brand, original subscription identity and request to the transaction
  that commits deletion/closure/audit. A stale request must not erase a later join.

For each changed invariant, retain the valid request and the specific rejection,
replay, stale-state or interrupted case. Independently assert the destination,
status, headers and durable result. Use
[landing workerd routing tests](../../../apps/landing/tests/workers/routing.test.ts)
and relevant [waitlist suites](../../../apps/waitlist/tests/); UI visibility is
not authorization. Do not log addresses, authorization headers or key material.

For a failure, minimize host/path/method/brand/grant/state, test one causal
hypothesis and repair the earliest owner. Remove only rejected-hypothesis edits.
Rerun the original request and the affected Workers/D1 and browser/no-JS boundary.
Use package checks from AGENTS; read scripts because workerd/Playwright may build
and start local fixtures. Missing tooling remains unavailable proof.

Return the changed behavior and actual checks. Deployment, remote D1 migrations,
DNS, Access policy and secret rotation are separate external operations; source
or local tests do not establish their production state.
