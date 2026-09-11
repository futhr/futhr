import { describe, expect, it } from 'vitest'
import { brandForAliasHost } from '../../src/lib/brands/alias.ts'
import { brands } from '../../src/lib/brands/brands.ts'
import { brandForHost } from '../../src/lib/brands/host.ts'
import { strings } from '../../src/lib/brands/strings.ts'
import { apexForWww } from '../../src/lib/brands/www.ts'

const all = Object.values(brands)
const datePattern = /^\d{4}-\d{2}-\d{2}(?:\.\d+)?$/
const twoWordForm = /waiting[ -]list/i
const availabilityClaim = /available now|buy now|sign up today/i
const maxDescription = 160

const unique = <T>(values: readonly T[]) => new Set(values).size === values.length

describe('brand map', () => {
  it('lists the four venture hosts, each keyed by its id', () => {
    expect(all.map(({ host }) => host)).toEqual([
      'rivure.com',
      'diggymon.com',
      'refpath.io',
      'orvane.io'
    ])
    for (const [key, brand] of Object.entries(brands)) {
      expect(brand.id).toBe(key)
      expect(brand.host).toBe(brand.host.toLowerCase())
      expect(brand.host.startsWith('www.')).toBe(false)
    }
  })

  it('gives every brand unique, bounded metadata and visible copy', () => {
    expect(unique(all.map(({ title }) => title))).toBe(true)
    expect(unique(all.map(({ description }) => description))).toBe(true)
    expect(unique(all.map(({ lede }) => lede))).toBe(true)
    expect(unique(all.map(({ closing }) => closing))).toBe(true)
    for (const brand of all) {
      expect(brand.description.length).toBeLessThanOrEqual(maxDescription)
      expect(brand.title.startsWith(`${brand.name} — `)).toBe(true)
      expect(brand.consentVersion).toMatch(datePattern)
      expect(brand.keywords).toContain(brand.name)
    }
  })

  it('never writes waitlist as two words and never claims availability', () => {
    const visible = all.flatMap((brand) => [
      brand.title,
      brand.description,
      brand.lede,
      brand.closing,
      strings.form.purpose(brand),
      strings.form.sent
    ])
    for (const text of visible) {
      expect(text).not.toMatch(twoWordForm)
      expect(text).not.toMatch(availabilityClaim)
    }
  })
})

describe('brandForHost', () => {
  it('resolves exact production hostnames regardless of case, port, or trailing dot', () => {
    expect(brandForHost('rivure.com')?.id).toBe('rivure')
    expect(brandForHost('RIVURE.COM')?.id).toBe('rivure')
    expect(brandForHost('rivure.com:8787')?.id).toBe('rivure')
    expect(brandForHost('rivure.com.')?.id).toBe('rivure')
    expect(brandForHost(' orvane.io ')?.id).toBe('orvane')
  })

  it('accepts <id>.localhost as a stand-in for the apex on a workstation', () => {
    expect(brandForHost('rivure.localhost')?.id).toBe('rivure')
    expect(brandForHost('Orvane.localhost:8787')?.id).toBe('orvane')
  })

  it('fails closed for anything that is not one of the four apexes', () => {
    for (const host of [
      'www.rivure.com',
      'orvane.ai',
      'www.orvane.ai',
      'reloved.eco',
      'reloved.localhost',
      'futhr.io',
      'ui.futhr.io',
      'rivure.com.evil.example',
      'evil-rivure.com',
      'evil.localhost',
      'www.rivure.localhost',
      'localhost',
      '127.0.0.1',
      '',
      null,
      undefined
    ]) {
      expect(brandForHost(host)).toBeUndefined()
    }
  })
})

describe('brandForAliasHost', () => {
  it('maps both Orvane alias hostnames to its canonical brand', () => {
    expect(brandForAliasHost('orvane.ai')?.host).toBe('orvane.io')
    expect(brandForAliasHost('WWW.ORVANE.AI.:8787')?.host).toBe('orvane.io')
  })

  it('does not treat canonical or unrelated hosts as aliases', () => {
    for (const host of ['orvane.io', 'www.orvane.io', 'not-orvane.ai', '', null, undefined]) {
      expect(brandForAliasHost(host)).toBeUndefined()
    }
  })
})

describe('apexForWww', () => {
  it('maps a www hostname to its brand and nothing else', () => {
    expect(apexForWww('www.rivure.com')?.id).toBe('rivure')
    expect(apexForWww('WWW.Orvane.io:8787')?.id).toBe('orvane')
    for (const host of [
      'rivure.com',
      'wwwrivure.com',
      'www.reloved.eco',
      'www.futhr.io',
      'www.www.rivure.com',
      '',
      null
    ]) {
      expect(apexForWww(host)).toBeUndefined()
    }
  })
})
