import { describe, expect, it } from 'vitest'
import { site } from '$lib/config/site'

describe('site metadata', () => {
  it('keeps browser and machine-readable identity on the canonical source', () => {
    expect(site.images.favicon).toBe('/icons/favicon.svg')
    expect(site.images.faviconLight).toBe('/icons/favicon-light.svg')
    expect(site.images.faviconDark).toBe('/icons/favicon-dark.svg')
    expect(site.documents.webManifest.icons[0]?.src).toBe(site.images.icon)
    expect(site.documents.webManifest.name).toContain(site.displayName)
    expect(site.documents.webManifest.description).toBe(site.description)
    expect(site.documents.robotsText).toContain(`${site.canonicalUrl}sitemap.xml`)
    expect(site.documents.robotsText).toContain(
      'User-agent: OAI-SearchBot\nUser-agent: ChatGPT-User'
    )
    expect(site.documents.robotsText).toContain(
      'Content-Signal: search=yes, ai-input=yes, ai-train=yes'
    )
  })
})
