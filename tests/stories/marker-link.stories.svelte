<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import { expect } from 'storybook/test'
  import MarkerLink from '$lib/components/marker-link.svelte'

  const { Story } = defineMeta({
    title: 'Primitives/Marker link',
    component: MarkerLink,
    args: {
      href: 'https://github.com/futhr',
      label: 'Open Futhr on GitHub',
      seed: 17
    }
  })
</script>

<Story
  name="Default"
  play={async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: 'Open Futhr on GitHub' })

    await expect(link).toHaveAttribute('href', 'https://github.com/futhr')
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    await expect(link.querySelectorAll('path')).toHaveLength(2)
  }}
>
  Open Futhr on GitHub
</Story>
