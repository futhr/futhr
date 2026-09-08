interface Project {
  readonly id: 'wotex' | 'reloved' | 'recetas'
  readonly host: string
  readonly name: string
  readonly mark?: Project['id']
  readonly statement?: string
  readonly description?: string
  readonly link?: { readonly href: string; readonly label: string; readonly kind: string }
  readonly relationship?: {
    readonly from: { readonly label: string; readonly value: string }
    readonly to: { readonly label: string; readonly value: string }
  }
  readonly indexed: boolean
}

export type { Project }
