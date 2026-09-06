type FormError = 'invalid_email' | 'rate_limited' | 'unavailable'

/** Shared email form copy and action feedback. */
interface EmailFormProps {
  readonly id: string
  readonly text: {
    readonly heading: string
    /** One sentence on what the address is for, which is the whole purpose statement. */
    readonly purpose: string
    readonly email: string
    readonly submit: string
    readonly submitting: string
    /** Label of the hidden field bots fill in. */
    readonly trap: string
    readonly sentHeading: string
    readonly sent: string
    readonly invalidEmail: string
    readonly rateLimited: string
    readonly unavailable?: string
  }
  readonly result?:
    | {
        readonly complete?: boolean | undefined
        readonly error?: FormError | undefined
      }
    | undefined
}

export type { EmailFormProps }
