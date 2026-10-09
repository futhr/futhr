import { loadShowcase } from '$lib/server/showcase'
import { structuredData } from '$lib/server/structured-data'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
  const items = await loadShowcase()
  return { items, structuredData: structuredData(items) }
}
