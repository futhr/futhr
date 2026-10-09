import { expect, test } from 'vitest'
import { render } from 'vitest-browser-svelte'
import Footer from '$lib/components/footer.svelte'
import { site } from '$lib/config/site'

const socialLinks = [
  ['Mastodon', site.links.mastodon],
  ['Bluesky', site.links.bluesky],
  ['X', site.links.x],
  ['GitHub', site.links.github]
] as const

test('renders every identity, social destination and footer group', async () => {
  const screen = await render(Footer)

  await expect.element(screen.getByRole('contentinfo')).toBeVisible()
  await expect
    .element(screen.getByRole('navigation', { name: site.ui.socialNavigation }))
    .toBeVisible()
  await expect
    .element(screen.getByRole('navigation', { name: site.ui.footerNavigation }))
    .toBeVisible()

  await Promise.all(
    socialLinks.map(([label, href]) =>
      expect
        .element(screen.getByRole('link', { name: label, exact: true }))
        .toHaveAttribute('href', href)
    )
  )

  await Promise.all(
    [...site.footer.agents, ...site.footer.elsewhere]
      .flatMap(({ label, href }) => (href === null ? [] : [{ label, href }]))
      .map(async ({ label, href }) => {
        const link = screen.getByRole('link', { name: label })
        await expect.element(link).toHaveAttribute('href', href)
        await expect.element(link).toHaveAttribute('target', '_blank')
        await expect.element(link).toHaveAttribute('rel', 'noopener')
      })
  )

  expect(screen.container.querySelectorAll('svg')).toHaveLength(10)
  expect(screen.container.querySelectorAll('img')).toHaveLength(0)
})
