import { controller } from '$lib/brands/controller'
import { strings } from '$lib/brands/strings'
import type { Brand } from '$lib/types/brand'

const ink = '#1b1b1b'

const origin = (brand: Brand) => `https://${brand.host}`

const webManifest = (brand: Brand) => ({
  name: brand.name,
  short_name: brand.name,
  description: brand.description,
  lang: strings.language,
  dir: 'ltr',
  id: '/',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  display_override: ['standalone', 'minimal-ui'],
  orientation: 'any',
  background_color: ink,
  theme_color: ink,
  categories: ['business'],
  prefer_related_applications: false,
  icons: [
    { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    {
      src: '/icons/icon-maskable-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable'
    }
  ]
})

const robotsText = (brand: Brand) => `User-agent: *
Allow: /

Sitemap: ${origin(brand)}/sitemap.xml
`

const sitemapXml = (brand: Brand) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${origin(brand)}/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`

/** llms.txt per llmstxt.org: the brand, its status, and only this domain's pages. */
const llmsText = (brand: Brand) => `# ${brand.name}

> ${brand.lede}

${brand.name} is pre-launch. ${origin(brand)} collects an email address for one purpose only: to send ${brand.name} ${brand.updates} when there is something to announce. Nothing is sent before then. No product is available from this site, and nothing here is a statement of availability. The controller is ${controller.name}, ${controller.location}.

## Pages

- [Waitlist](${origin(brand)}/): ${brand.description}
- [Privacy](${origin(brand)}/privacy): what is collected, the legal basis, retention, and how to withdraw
- [Withdraw](${origin(brand)}/withdraw): request removal for manual review

## Contact

- [Email](mailto:${controller.contact})
`

const structuredData = (brand: Brand) =>
  JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: brand.name,
        url: `${origin(brand)}/`,
        description: brand.description,
        inLanguage: strings.language
      },
      {
        '@type': 'Organization',
        name: brand.name,
        url: `${origin(brand)}/`,
        logo: `${origin(brand)}/icons/icon-512.png`,
        founder: { '@type': 'Person', name: controller.name }
      }
    ]
  }).replaceAll('<', '\\u003c')

/** Everything generated from the brand record besides the HTML pages. */
const brandDocuments = (brand: Brand) => ({
  origin: origin(brand),
  webManifest: webManifest(brand),
  robotsText: robotsText(brand),
  sitemapXml: sitemapXml(brand),
  llmsText: llmsText(brand),
  structuredData: structuredData(brand)
})

export { brandDocuments }
