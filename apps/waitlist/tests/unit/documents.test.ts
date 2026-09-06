import { describe, expect, it } from 'vitest'
import { brands } from '../../src/lib/brands/brands.ts'
import { controller } from '../../src/lib/brands/controller.ts'
import { brandDocuments } from '../../src/lib/brands/documents.ts'
import { privacyNotice } from '../../src/lib/brands/privacy.ts'

const all = Object.values(brands)
const locTag = /<loc>/g
const otherHosts = (host: string) =>
  all.map((brand) => brand.host).filter((other) => other !== host)

describe('generated brand documents', () => {
  it('builds an origin-scoped manifest with four icons and ink colours', () => {
    for (const brand of all) {
      const { webManifest } = brandDocuments(brand)
      expect(webManifest.name).toBe(brand.name)
      expect(webManifest.short_name).toBe(brand.name)
      expect(webManifest.description).toBe(brand.description)
      expect(webManifest.id).toBe('/')
      expect(webManifest.start_url).toBe('/')
      expect(webManifest.scope).toBe('/')
      expect(webManifest.theme_color).toBe('#1b1b1b')
      expect(webManifest.background_color).toBe('#1b1b1b')
      expect(webManifest.icons.map(({ purpose }) => purpose)).toEqual([
        'any',
        'any',
        'any',
        'maskable'
      ])
    }
  })

  it('keeps robots, the sitemap, and llms.txt on the brand domain only', () => {
    for (const brand of all) {
      const documents = brandDocuments(brand)
      expect(documents.robotsText).toContain(`Sitemap: https://${brand.host}/sitemap.xml`)
      expect(documents.sitemapXml.match(locTag)).toHaveLength(1)
      expect(documents.sitemapXml).toContain(`<loc>https://${brand.host}/</loc>`)
      expect(documents.llmsText.startsWith(`# ${brand.name}\n\n> ${brand.lede}`)).toBe(true)
      expect(documents.llmsText).toContain('pre-launch')
      expect(documents.llmsText).toContain(`https://${brand.host}/privacy`)
      expect(documents.llmsText).toContain(`mailto:${controller.contact}`)
      expect(documents.llmsText).not.toContain('https://futhr.io')
      for (const other of otherHosts(brand.host)) {
        expect(documents.llmsText).not.toContain(other)
        expect(documents.robotsText).not.toContain(other)
      }
      const data = JSON.parse(documents.structuredData) as {
        '@graph': Array<{ '@type': string; url: string }>
      }
      expect(data['@graph'].map((node) => node.url)).toEqual([
        `https://${brand.host}/`,
        `https://${brand.host}/`
      ])
    }
  })
})

describe('privacy notice', () => {
  it('names the controller, the basis, retention, rights, and the authority, and nothing beyond the domain', () => {
    for (const brand of all) {
      const paragraphs = privacyNotice(brand)
      const text = paragraphs.join(' ')
      expect(paragraphs.length).toBeLessThanOrEqual(6)
      expect(text).toContain(controller.name)
      expect(text).toContain(controller.contact)
      expect(text).toContain('Article 6(1)(a)')
      expect(text).toContain(`version ${brand.consentVersion}`)
      expect(text).toContain(`${controller.retention.reviewMonths} months`)
      expect(text).toContain(controller.authority.name)
      expect(text).toContain(`${brand.name} ${brand.updates}`)
      expect(text).toContain(`covers ${brand.host} only`)
      expect(text).not.toContain('futhr:lab')
      expect(text).not.toContain('https://futhr.io')
      for (const other of otherHosts(brand.host)) {
        expect(text).not.toContain(other)
      }
    }
  })
})
