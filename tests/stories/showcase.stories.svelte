<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import { expect } from 'storybook/test'
  import Showcase from '$lib/components/showcase.svelte'
  import type { ShowcaseEntry } from '$lib/types/showcase-entry'

  // Real entries from the site: the thesis and the first two Elixir rows.
  const items: ShowcaseEntry[] = [
    {
      order: 1,
      slug: 'thesis',
      group: 'Thesis',
      title: 'Trust, interoperability, unit economics.',
      lede: 'Platforms and open infrastructure for domains where software decisions carry real consequences.',
      repositories: [],
      links: [],
      body: 'A capital-efficient portfolio of platforms and open infrastructure for domains where software decisions carry operational, financial, or legal consequences.\n\n**The thesis:** trust, interoperability, and unit economics are architectural constraints, not features added after scale. Across the portfolio, probabilistic intelligence sits above a deterministic foundation of durable state, explicit contracts, verification, and recovery. The full loop is designed as one: domain model, runtime, product, distribution, and operating model. Shared open-source cores compound engineering leverage and preserve customer control; commercial platforms monetize operation, assurance, and domain outcomes.\n\n*Bootstrapped by default, built for durable ownership.*',
      bodyHtml:
        '<p>A capital-efficient portfolio of platforms and open infrastructure for domains where software decisions carry operational, financial, or legal consequences.</p>\n<p><strong>The thesis:</strong> trust, interoperability, and unit economics are architectural constraints, not features added after scale. Across the portfolio, probabilistic intelligence sits above a deterministic foundation of durable state, explicit contracts, verification, and recovery. The full loop is designed as one: domain model, runtime, product, distribution, and operating model. Shared open-source cores compound engineering leverage and preserve customer control; commercial platforms monetize operation, assurance, and domain outcomes.</p>\n<p><em>Bootstrapped by default, built for durable ownership.</em></p>'
    },
    {
      order: 2,
      slug: 'sigil-guard',
      group: 'Elixir & OTP',
      title: 'SigilGuard',
      lede: 'The in-process security runtime for autonomous agents touching production tools and data.',
      repositories: ['refpath/sigil_guard'],
      links: [
        { label: 'Repository', href: 'https://github.com/refpath/sigil_guard' },
        { label: 'HexDocs', href: 'https://hexdocs.pm/sigil_guard/' }
      ],
      body: 'An embedded Elixir enforcement layer between autonomous agents and production systems. Tool calls, returned data, and outbound transfers pass through deterministic policy before execution. Secret scanning, source-to-sink controls, pinned tool manifests, exact-action confirmation, signed attestations, and audit records turn agent authority into an inspectable security boundary. The decision path stays inside the host application, removing a network dependency from the point of enforcement. **SigilGuard** supplies the control layer required when probabilistic models gain access to consequential tools.',
      bodyHtml:
        '<p>An embedded Elixir enforcement layer between autonomous agents and production systems. Tool calls, returned data, and outbound transfers pass through deterministic policy before execution. Secret scanning, source-to-sink controls, pinned tool manifests, exact-action confirmation, signed attestations, and audit records turn agent authority into an inspectable security boundary. The decision path stays inside the host application, removing a network dependency from the point of enforcement. <strong>SigilGuard</strong> supplies the control layer required when probabilistic models gain access to consequential tools.</p>'
    },
    {
      order: 3,
      slug: 'wotex',
      group: 'Elixir & OTP',
      title: 'WoTEx',
      lede: 'OTP-native Elixir libraries that bring the W3C Web of Things to the BEAM.',
      repositories: [],
      links: [{ label: 'GitHub organization', href: 'https://github.com/wotex-project' }],
      body: "An open-source family of focused Elixir libraries for the W3C Web of Things and the edge-to-cloud continuum. IoT remains fragmented across vendors, protocols, and incompatible data models, so every product repeats the same description, discovery, and binding work and interoperability stays a promise on a diagram. **WoTEx** supplies shared terminology and contracts for describing a Thing's properties, actions, and events, validating Thing Descriptions, connecting protocol bindings, discovering Things, composing caller-owned runtimes, and keeping behavior consistent from cloud services to disconnected edge devices, with conformance testing against the published specifications and room for machine learning close to the device.\n\nEach library follows OTP conventions: independently useful, explicit about ownership, and passive until the consuming application starts it. Nothing imposes a database, supervision tree, web framework, or proprietary platform on the host. The aim is shared infrastructure for the Elixir, Nerves, and industrial IoT communities, open enough to adopt without inheriting a platform and extensible toward future protocols and edge intelligence. *WoTEx is in development; no package is published yet.*",
      bodyHtml:
        '<p>An open-source family of focused Elixir libraries for the W3C Web of Things and the edge-to-cloud continuum. IoT remains fragmented across vendors, protocols, and incompatible data models, so every product repeats the same description, discovery, and binding work and interoperability stays a promise on a diagram. <strong>WoTEx</strong> supplies shared terminology and contracts for describing a Thing&#39;s properties, actions, and events, validating Thing Descriptions, connecting protocol bindings, discovering Things, composing caller-owned runtimes, and keeping behavior consistent from cloud services to disconnected edge devices, with conformance testing against the published specifications and room for machine learning close to the device.</p>\n<p>Each library follows OTP conventions: independently useful, explicit about ownership, and passive until the consuming application starts it. Nothing imposes a database, supervision tree, web framework, or proprietary platform on the host. The aim is shared infrastructure for the Elixir, Nerves, and industrial IoT communities, open enough to adopt without inheriting a platform and extensible toward future protocols and edge intelligence. <em>WoTEx is in development; no package is published yet.</em></p>'
    }
  ]

  const thesisName = /Trust, interoperability/
  const sigilGuardWords = /An embedded Elixir enforcement layer/
  const { Story } = defineMeta({
    title: 'Showcase/Collection',
    component: Showcase,
    args: { items }
  })
</script>

<Story
  name="Disclosure Flow"
  play={async ({ canvas, userEvent }) => {
    const thesis = canvas.getByRole('button', { name: thesisName })
    const sigilGuard = canvas.getByRole('button', { name: 'Elixir & OTP SigilGuard' })

    await expect(thesis).toHaveAttribute('aria-expanded', 'true')
    await expect(sigilGuard).toHaveAttribute('aria-expanded', 'false')
    sigilGuard.scrollIntoView({ block: 'center' })
    await userEvent.click(sigilGuard)
    await expect(thesis).toHaveAttribute('aria-expanded', 'false')
    await expect(sigilGuard).toHaveAttribute('aria-expanded', 'true')
    await expect(
      canvas.getByText(sigilGuardWords).closest('[aria-hidden]')
    ).toHaveAttribute('aria-hidden', 'false')
  }}
/>
