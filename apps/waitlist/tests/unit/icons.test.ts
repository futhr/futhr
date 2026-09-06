import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { brands } from '../../src/lib/brands/brands.ts'
import { composeIcon } from '../../src/lib/brands/icons.ts'

const logos = new URL('../../../../src/lib/components/logos/', import.meta.url)
const icons = (id: string) => new URL(`../../static/brands/${id}/icons/`, import.meta.url)
const pngSizes: ReadonlyArray<readonly [string, number, number]> = [
  ['favicon-32.png', 32, 32],
  ['favicon-48.png', 48, 48],
  ['apple-touch-icon.png', 180, 180],
  ['icon-192.png', 192, 192],
  ['icon-512.png', 512, 512],
  ['icon-maskable-512.png', 512, 512],
  ['social.png', 1200, 630]
]

const pngSize = (bytes: Buffer): [number, number] => [
  bytes.readUInt32BE(16),
  bytes.readUInt32BE(20)
]

describe('brand icons', () => {
  it('composes an opaque ink icon with the mark centred in paper', async () => {
    const markSource = await readFile(new URL('rivure.svelte', logos), 'utf8')
    const rounded = composeIcon({ markSource, title: 'Rivure', shape: 'rounded' })
    const maskable = composeIcon({ markSource, title: 'Rivure', shape: 'maskable' })
    expect(rounded).toContain('xmlns="http://www.w3.org/2000/svg"')
    expect(rounded).toContain('<title>Rivure</title>')
    expect(rounded).toContain('rx="112" fill="#1b1b1b"')
    expect(rounded).toContain('viewBox="-17 0 345 345" color="#dcdbd6"')
    expect(rounded).not.toContain('aria-label')
    expect(rounded).not.toContain('prefers-color-scheme')
    expect(maskable).toContain('rx="0"')
    expect(maskable).toContain('width="280" height="280"')
    expect(() => composeIcon({ markSource: '<div/>', title: 'x', shape: 'rounded' })).toThrow()
  })

  it('keeps the committed SVGs in step with the mark components', async () => {
    for (const brand of Object.values(brands)) {
      const markSource = await readFile(new URL(`${brand.id}.svelte`, logos), 'utf8')
      const [favicon, icon] = await Promise.all([
        readFile(new URL('favicon.svg', icons(brand.id)), 'utf8'),
        readFile(new URL('icon.svg', icons(brand.id)), 'utf8')
      ])
      expect(favicon).toBe(composeIcon({ markSource, title: brand.name, shape: 'rounded' }))
      expect(icon).toBe(composeIcon({ markSource, title: `${brand.name} icon`, shape: 'rounded' }))
    }
  })

  it('ships every raster size the manifest, Apple, and social cards expect', async () => {
    for (const brand of Object.values(brands)) {
      for (const [file, width, height] of pngSizes) {
        const bytes = await readFile(new URL(file, icons(brand.id)))
        expect(bytes.subarray(1, 4).toString('latin1')).toBe('PNG')
        expect(pngSize(bytes)).toEqual([width, height])
      }
    }
  })
})
