import type { Brand } from '$lib/types/brand'
import type { BrandId } from '$lib/types/brand-id'

const consentVersion = '2026-09-06'

/**
 * The closed brand map, in local navigation order. Copy is
 * unique per brand and follows the showcase voice: noun-led, pre-release,
 * no availability claims. Colours, type, and layout come from the shared style
 * system; the brand is the mark, the words, and the metadata.
 */
const brands: Readonly<Record<BrandId, Brand>> = {
  rivure: {
    id: 'rivure',
    host: 'rivure.com',
    name: 'Rivure',
    title: 'Rivure — billing that cannot drift from the product it bills',
    description:
      'Rivure is embedded billing infrastructure for Elixir products, in development. Join the waitlist for launch updates.',
    lede: 'Embedded billing infrastructure that keeps product state and financial state in one transaction.',
    closing: 'Billing that cannot drift from the product it bills.',
    updates: 'launch updates',
    keywords: ['Rivure', 'billing', 'Elixir', 'subscriptions', 'invoicing', 'ledger'],
    consentVersion
  },
  diggymon: {
    id: 'diggymon',
    host: 'diggymon.com',
    name: 'Diggymon',
    title: 'Diggymon — the creator-owned platform for CGI work',
    description:
      'Diggymon is a local-first business platform for CGI creators, in development. Join the waitlist for launch updates.',
    lede: 'A local-first business platform for CGI creators, projects, and professional growth.',
    closing: 'The work builds the identity; the identity brings the next work.',
    updates: 'launch updates',
    keywords: ['Diggymon', 'CGI', 'creators', 'local-first', 'portfolio', 'production'],
    consentVersion
  },
  refpath: {
    id: 'refpath',
    host: 'refpath.io',
    name: 'Refpath',
    title: 'Refpath — execution infrastructure for autonomous software',
    description:
      'Refpath is open execution infrastructure for autonomous software, in development. Join the waitlist for launch updates.',
    lede: 'Open execution infrastructure for autonomous software that has to finish real work.',
    closing: 'Models are interchangeable. Execution records are not.',
    updates: 'launch updates',
    keywords: ['Refpath', 'agent runtime', 'durable execution', 'autonomous software', 'Elixir'],
    consentVersion
  },
  reloved: {
    id: 'reloved',
    host: 'reloved.eco',
    name: 'Reloved',
    title: 'Reloved — every household an independent second-hand storefront',
    description:
      'Reloved is decentralized resale infrastructure that gives every household its own storefront, in development. Join the waitlist for launch updates.',
    lede: 'Decentralized resale infrastructure that turns every household into an independent second-hand storefront.',
    closing: 'Owned by the household, found by everyone.',
    updates: 'launch updates',
    keywords: ['Reloved', 'second-hand', 'resale', 'decentralized commerce', 'edge', 'open source'],
    consentVersion
  },
  orvane: {
    id: 'orvane',
    host: 'orvane.io',
    name: 'Orvane',
    title: 'Orvane — research on the failure boundaries of connected systems',
    description:
      'Orvane is an independent research lab studying the failure boundaries of standards-based connected systems. Join the waitlist for research releases.',
    lede: 'Independent research on the failure boundaries of standards-based connected systems.',
    closing: 'Findings from the edge, published as research.',
    updates: 'research releases',
    keywords: ['Orvane', 'research', 'Web of Things', 'IoT', 'connected systems', 'reliability'],
    consentVersion
  }
}

export { brands }
