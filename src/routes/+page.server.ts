import { loadShowcase } from '#lib/server/showcase.ts'
import { structuredData } from '#lib/server/structured-data.ts'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
  const items = await loadShowcase()
  return { items, structuredData: structuredData(items) }
}
