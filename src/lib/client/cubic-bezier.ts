/**
 * A CSS-compatible cubic-bezier easing, so scripted motion (the scroll glide)
 * can share one curve with the Web Animations transitions on the rows.
 */
const cubicBezier = (x1: number, y1: number, x2: number, y2: number) => {
  const coefficients = (a1: number, a2: number) => ({
    a: 1 - 3 * a2 + 3 * a1,
    b: 3 * a2 - 6 * a1,
    c: 3 * a1
  })
  const x = coefficients(x1, x2)
  const y = coefficients(y1, y2)
  const at = ({ a, b, c }: { a: number; b: number; c: number }, t: number) =>
    ((a * t + b) * t + c) * t
  const slopeX = (t: number) => (3 * x.a * t + 2 * x.b) * t + x.c

  return (progress: number): number => {
    if (progress <= 0) {
      return 0
    }
    if (progress >= 1) {
      return 1
    }
    let t = progress
    for (let iteration = 0; iteration < 8; iteration += 1) {
      const slope = slopeX(t)
      if (Math.abs(slope) < 1e-6) {
        break
      }
      t -= (at(x, t) - progress) / slope
    }
    return at(y, t)
  }
}

export { cubicBezier }
