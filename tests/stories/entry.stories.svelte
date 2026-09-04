<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import { expect, fn } from 'storybook/test'
  import Entry from '$lib/components/entry.svelte'

  // The real WoTEx entry: two paragraphs, bold and italic emphasis, one link.
  const example = {
    order: 1,
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
  const openingWords = /An open-source family of focused Elixir libraries/

  const { Story } = defineMeta({
    title: 'Showcase/Entry',
    component: Entry,
    args: {
      item: example,
      index: 0,
      isOpen: false,
      divider: true,
      onToggle: fn()
    }
  })
</script>

<Story
  name="Closed"
  play={async ({ canvas, args, userEvent }) => {
    const button = canvas.getByRole('button', { name: `${example.group} ${example.title}` })
    const panel = canvas.getByText(openingWords).closest('[aria-hidden]')

    await expect(button).toHaveAttribute('aria-expanded', 'false')
    await expect(panel).toHaveAttribute('aria-hidden', 'true')
    await userEvent.click(button)
    await expect(args.onToggle).toHaveBeenCalledOnce()
  }}
/>

<Story
  name="Open"
  args={{ isOpen: true }}
  play={async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: `${example.group} ${example.title}` })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
    await expect(canvas.getByRole('link', { name: 'GitHub organization' })).toHaveAttribute(
      'rel',
      'noopener noreferrer'
    )
    await expect(canvas.getByText('WoTEx', { selector: 'strong' })).toBeVisible()
  }}
/>

<Story name="Inverse" args={{ index: 1, isOpen: true }} />
