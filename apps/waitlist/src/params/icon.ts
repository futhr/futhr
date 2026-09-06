import type { ParamMatcher } from '@sveltejs/kit'

const iconFile = /^[a-z0-9-]+\.(?:png|svg)$/

export const match: ParamMatcher = (param) => iconFile.test(param)
