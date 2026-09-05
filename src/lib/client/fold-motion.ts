import { cubicBezier } from '$lib/client/cubic-bezier'

/** One curve and one clock for everything that moves when a row opens. */
const foldMotion = {
  duration: 420,
  easing: 'cubic-bezier(0.2, 0, 0, 1)',
  ease: cubicBezier(0.2, 0, 0, 1)
} as const

export { foldMotion }
