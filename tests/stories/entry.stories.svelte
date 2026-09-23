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
    body: 'Connected products still repeat the work of describing devices, discovering them, and binding incompatible protocols. WoTEx develops focused Elixir libraries for **W3C Thing Descriptions**, interactions, bindings, and discovery across cloud and edge runtimes. Each library follows OTP conventions and stays independently useful: the host application owns its supervision tree, storage, and protocol clients.\n\nConformance tests tie the shared contracts to published specifications. The aim is reusable infrastructure for Elixir and Nerves teams building connected systems without adopting a proprietary platform.\n\n*One standard for Things, and a runtime built to keep them running.*',
    bodyHtml:
      '<p>Connected products still repeat the work of describing devices, discovering them, and binding incompatible protocols. WoTEx develops focused Elixir libraries for <strong>W3C Thing Descriptions</strong>, interactions, bindings, and discovery across cloud and edge runtimes. Each library follows OTP conventions and stays independently useful: the host application owns its supervision tree, storage, and protocol clients.</p>\n<p>Conformance tests tie the shared contracts to published specifications. The aim is reusable infrastructure for Elixir and Nerves teams building connected systems without adopting a proprietary platform.</p>\n<p><em>One standard for Things, and a runtime built to keep them running.</em></p>'
  }
  const openingWords = /Connected products still repeat the work/

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
    await expect(canvas.getByText('W3C Thing Descriptions', { selector: 'strong' })).toBeVisible()
  }}
/>

<Story name="Inverse" args={{ index: 1, isOpen: true }} />
