import { describe, expect, it } from 'vitest'
import { site } from '$lib/config/site'

describe('site metadata', () => {
  it('keeps browser and machine-readable identity on the canonical source', () => {
    expect(site.images.favicon).toBe('/icons/favicon.svg')
    expect(site.documents.webManifest.icons[0]?.src).toBe(site.images.icon)
    expect(site.documents.webManifest.name).toContain(site.displayName)
    expect(site.documents.webManifest.description).toBe(site.description)
    expect(site.documents.robotsText).toContain(`${site.canonicalUrl}sitemap.xml`)
    expect(site.documents.sitemapXml).toContain(`<loc>${site.canonicalUrl}</loc>`)
  })

  it('publishes valid structured data from the shared identity', () => {
    const data = JSON.parse(site.documents.structuredData) as {
      '@graph': Array<{ name: string; url: string }>
    }

    expect(data['@graph']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: site.author.name, url: site.canonicalUrl }),
        expect.objectContaining({ name: site.name, url: site.canonicalUrl })
      ])
    )
  })
})
