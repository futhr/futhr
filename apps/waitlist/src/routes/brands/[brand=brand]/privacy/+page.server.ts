import { strings } from '$lib/brands/strings'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = ({ locals }) => ({
  meta: {
    title: strings.privacy.title(locals.brand),
    description: strings.privacy.lede(locals.brand),
    path: '/privacy',
    indexable: true
  }
})
