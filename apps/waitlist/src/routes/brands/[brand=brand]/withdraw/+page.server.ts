import { strings } from '$lib/brands/strings'
import { withdraw } from '$lib/server/withdraw'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = ({ locals }) => ({
  meta: {
    title: strings.withdraw.title(locals.brand),
    description: strings.withdraw.lede,
    path: '/withdraw',
    indexable: false
  },
  text: {
    ...strings.form,
    ...strings.withdraw.form,
    purpose: strings.withdraw.purpose(locals.brand)
  }
})

export const actions: Actions = { default: withdraw }
