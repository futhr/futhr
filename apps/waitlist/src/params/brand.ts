import type { ParamMatcher } from '@sveltejs/kit'
import { brands } from '$lib/brands/brands'

export const match: ParamMatcher = (param) => Object.hasOwn(brands, param)
