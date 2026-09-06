import { foldMotion } from '$lib/client/fold-motion'

/** Scroll with the rows' height animation; user input or teardown cancels it. */
const createRowGlide = () => {
  let glideFrame = 0
  const interruptEvents = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const

  const stopGlide = () => {
    cancelAnimationFrame(glideFrame)
    for (const type of interruptEvents) {
      globalThis.removeEventListener(type, stopGlide)
    }
  }

  // A closing row reports its final height, not its current animated height.
  const settledHeight = (article: HTMLElement) => {
    const effect = article.getAnimations()[0]?.effect
    const keyframe = effect instanceof KeyframeEffect ? effect.getKeyframes().at(-1) : undefined
    const { height }: Partial<ComputedKeyframe> = keyframe ?? {}
    return typeof height === 'string'
      ? Number.parseFloat(height)
      : article.getBoundingClientRect().height
  }

  const to = (section: HTMLElement, index: number) => {
    stopGlide()
    const sectionTop = section.getBoundingClientRect().top + globalThis.scrollY
    const above = [...section.querySelectorAll<HTMLElement>('article')].slice(0, index)
    const target = Math.round(
      above.reduce((sum, article) => sum + settledHeight(article), sectionTop)
    )
    const from = globalThis.scrollY
    if (from === target) {
      return
    }
    if (globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      globalThis.scrollTo({ top: target, behavior: 'instant' })
      return
    }
    for (const type of interruptEvents) {
      globalThis.addEventListener(type, stopGlide, { passive: true })
    }
    const started = performance.now()
    const step = (now: number) => {
      const progress = Math.min(1, (now - started) / foldMotion.duration)
      globalThis.scrollTo({
        top: from + (target - from) * foldMotion.ease(progress),
        behavior: 'instant'
      })
      if (progress < 1) {
        glideFrame = requestAnimationFrame(step)
      } else {
        stopGlide()
      }
    }
    glideFrame = requestAnimationFrame(step)
  }

  return { to, stop: stopGlide }
}

export { createRowGlide }
