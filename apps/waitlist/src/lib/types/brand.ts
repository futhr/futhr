import type { BrandId } from '$lib/types/brand-id'

/**
 * One venture waitlist. The record is closed and typed; the Worker derives it
 * from the request hostname and never from anything the browser sends.
 */
interface Brand {
  readonly id: BrandId
  /** Exact production hostname. Apex only; the Worker redirects www to it. */
  readonly host: string
  readonly name: string
  /** Document title and social title, unique per brand. */
  readonly title: string
  /** Meta description, unique per brand. */
  readonly description: string
  /** Visible one-sentence pitch. */
  readonly lede: string
  /** Italic closing line. */
  readonly closing: string
  /** What the address is collected for, as a noun phrase: "launch updates". */
  readonly updates: string
  readonly keywords: readonly string[]
  /** Stored with every record; bump when the consent wording changes. */
  readonly consentVersion: string
}

export type { Brand }
