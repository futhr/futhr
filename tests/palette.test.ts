import { describe, expect, it } from 'vitest'
import { palette } from '$lib/config/palette'
import stylesheet from '$lib/styles/site.css?raw'

const hexPattern = /^#[0-9a-f]{6}$/

const luminance = (hex: string) => {
  const [r, g, b] = (hex.match(/[0-9a-f]{2}/g) ?? []).map((part) => {
    const channel = Number.parseInt(part, 16) / 255
    return channel <= 0.039_28 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0)
}
const contrast = (a: string, b: string) => {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return ((high ?? 0) + 0.05) / ((low ?? 0) + 0.05)
}

describe('weekly brand palette', () => {
  it('covers the week in Date#getDay order with matching rgb values', () => {
    expect(palette.map(({ short }) => short)).toEqual([
      'Sun',
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat'
    ])
    for (const { hex, rgb } of palette) {
      expect(hex).toMatch(hexPattern)
      const channels = (hex.match(/[0-9a-f]{2}/g) ?? []).map((part) => Number.parseInt(part, 16))
      expect(rgb).toBe(channels.join(' '))
    }
  })

  it('matches the tokens declared in the stylesheet', () => {
    for (const { day, hex } of palette) {
      expect(stylesheet).toContain(`--brand-${day.toLowerCase()}: ${hex};`)
    }
    expect(stylesheet).toContain('--brand: var(--brand-monday);')
    for (const [index, { day }] of palette.entries()) {
      if (day !== 'Monday') {
        expect(stylesheet).toContain(
          `html[data-day="${index}"] {\n  --brand: var(--brand-${day.toLowerCase()});\n}`
        )
      }
    }
  })

  it('keeps every colour legible on ink and usable on paper', () => {
    for (const { hex } of palette) {
      expect(contrast(hex, '#1b1b1b')).toBeGreaterThanOrEqual(4)
      expect(contrast(hex, '#dcdbd6')).toBeGreaterThanOrEqual(2.4)
    }
  })
})
