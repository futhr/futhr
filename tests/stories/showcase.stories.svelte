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
      title: 'Trust, interoper­ability, unit economics.',
      lede: 'Platforms and open infrastructure for domains where software decisions carry real consequences.',
      repositories: [],
      links: [],
      body: 'Software in consequential domains needs durable state, explicit contracts, verification, and recovery beneath its interface. This portfolio builds platforms and open infrastructure on that foundation. Probabilistic systems can propose and interpret; **deterministic systems decide what runs** and record the outcome. Shared cores reduce repeated engineering and preserve customer control, while commercial products earn revenue through operation and domain outcomes.\n\n*Bootstrapped by default, built for durable ownership.*',
      bodyHtml:
        '<p>Software in consequential domains needs durable state, explicit contracts, verification, and recovery beneath its interface. This portfolio builds platforms and open infrastructure on that foundation. Probabilistic systems can propose and interpret; <strong>deterministic systems decide what runs</strong> and record the outcome. Shared cores reduce repeated engineering and preserve customer control, while commercial products earn revenue through operation and domain outcomes.</p>\n<p><em>Bootstrapped by default, built for durable ownership.</em></p>'
    },
    {
      order: 3,
      slug: 'sigil-guard',
      group: 'Elixir & OTP',
      title: 'SigilGuard',
      lede: 'The in-process security runtime for autonomous agents touching production tools and data.',
      repositories: ['refpath/sigil_guard'],
      links: [
        { label: 'Repository', href: 'https://github.com/refpath/sigil_guard' },
        { label: 'HexDocs', href: 'https://hexdocs.pm/sigil_guard/' }
      ],
      body: 'An embedded Elixir enforcement layer between autonomous agents and production systems. Tool calls, returned data, and outbound transfers pass through **deterministic policy before execution**. Secret scanning, source-to-sink controls, pinned tool manifests, exact-action confirmation, signed attestations, and audit records turn agent authority into an inspectable security boundary. The decision path stays inside the host application, removing a network dependency from the point of enforcement. SigilGuard supplies the control layer required when probabilistic models gain access to consequential tools.\n\n*Agents act; the host decides, and keeps the evidence.*',
      bodyHtml:
        '<p>An embedded Elixir enforcement layer between autonomous agents and production systems. Tool calls, returned data, and outbound transfers pass through <strong>deterministic policy before execution</strong>. Secret scanning, source-to-sink controls, pinned tool manifests, exact-action confirmation, signed attestations, and audit records turn agent authority into an inspectable security boundary. The decision path stays inside the host application, removing a network dependency from the point of enforcement. SigilGuard supplies the control layer required when probabilistic models gain access to consequential tools.</p>\n<p><em>Agents act; the host decides, and keeps the evidence.</em></p>'
    },
    {
      order: 2,
      slug: 'wotex',
      group: 'Elixir & OTP',
      title: 'WoTEx',
      lede: 'OTP-native Elixir libraries that bring the W3C Web of Things to the BEAM.',
      repositories: [],
      links: [{ label: 'GitHub organization', href: 'https://github.com/wotex-project' }],
      body: 'Connected products still repeat the work of describing devices, discovering them, and binding incompatible protocols. WoTEx develops focused Elixir libraries for **W3C Thing Descriptions**, interactions, bindings, and discovery across cloud and edge runtimes. Each library follows OTP conventions and stays independently useful: the host application owns its supervision tree, storage, and protocol clients.\n\nConformance tests tie the shared contracts to published specifications. The aim is reusable infrastructure for Elixir and Nerves teams building connected systems without adopting a proprietary platform.\n\n*One standard for Things, and a runtime built to keep them running.*',
      bodyHtml:
        '<p>Connected products still repeat the work of describing devices, discovering them, and binding incompatible protocols. WoTEx develops focused Elixir libraries for <strong>W3C Thing Descriptions</strong>, interactions, bindings, and discovery across cloud and edge runtimes. Each library follows OTP conventions and stays independently useful: the host application owns its supervision tree, storage, and protocol clients.</p>\n<p>Conformance tests tie the shared contracts to published specifications. The aim is reusable infrastructure for Elixir and Nerves teams building connected systems without adopting a proprietary platform.</p>\n<p><em>One standard for Things, and a runtime built to keep them running.</em></p>'
    }
  ].sort((a, b) => a.order - b.order)

  const thesisName = /Trust, interoper/
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
    const sigilGuard = canvas.getByRole('button', { name: 'SigilGuard' })

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
