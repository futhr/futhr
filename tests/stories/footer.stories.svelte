<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import { expect } from 'storybook/test'
  import Footer from '$lib/components/footer.svelte'

  const { Story } = defineMeta({
    title: 'Layout/Footer',
    component: Footer
  })
</script>

<Story
  name="Default"
  play={async ({ canvas }) => {
    await expect(canvas.getByRole('contentinfo')).toBeVisible()
    await expect(canvas.getByRole('navigation', { name: 'Social media' })).toBeVisible()
    await expect(canvas.getByRole('navigation', { name: 'Footer navigation' })).toBeVisible()
    await expect(canvas.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/futhr'
    )
    await expect(canvas.getByRole('img', { name: 'Futhr mark' })).toBeVisible()
    await expect(canvas.getByRole('img', { name: 'Refpath mark' })).toBeVisible()
  }}
/>
