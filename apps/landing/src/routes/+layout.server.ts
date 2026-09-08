import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = ({ locals }) => ({ project: locals.project })
