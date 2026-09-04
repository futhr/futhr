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
    site.footer.agents.map(({ label, href }) =>
      expect.element(screen.getByRole('link', { name: label })).toHaveAttribute('href', href)
    )
  )

  expect(screen.container.querySelectorAll('svg')).toHaveLength(12)
})
