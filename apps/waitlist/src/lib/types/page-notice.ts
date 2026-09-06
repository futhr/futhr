/** A one-message page: not found or error. */
interface PageNotice {
  readonly heading: string
  readonly text: string
  readonly back?: string
}

export type { PageNotice }
