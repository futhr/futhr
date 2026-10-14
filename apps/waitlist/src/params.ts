import { defineParams } from '@sveltejs/kit/params'
import { brands } from '#lib/brands/brands.ts'

const matchBrand = (param: string) => Object.hasOwn(brands, param)

const documents = new Set(['manifest.webmanifest', 'robots.txt', 'sitemap.xml', 'llms.txt'])

const matchDocument = (param: string) => documents.has(param)

const iconFile = /^[a-z0-9-]+\.(?:png|svg)$/
const matchIcon = (param: string) => iconFile.test(param)

export const params = defineParams({
  brand: (param) => (matchBrand(param) ? param : undefined),
  document: (param) => (matchDocument(param) ? param : undefined),
  icon: (param) => (matchIcon(param) ? param : undefined)
})
