import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = ({ locals }) => ({ brand: locals.brand })
