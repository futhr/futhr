import type { ParamMatcher } from '@sveltejs/kit'

const documents = new Set(['manifest.webmanifest', 'robots.txt', 'sitemap.xml', 'llms.txt'])

export const match: ParamMatcher = (param) => documents.has(param)
