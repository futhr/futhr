import { loadShowcase } from '$lib/server/showcase'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => ({ items: await loadShowcase() })
