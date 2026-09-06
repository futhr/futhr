type JoinError = 'invalid_email' | 'rate_limited'

/** Props of the join form: its copy and the last action result. */
interface JoinFormProps {
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
  }
  readonly result?:
    | {
        readonly joined?: boolean
        readonly error?: JoinError
      }
    | undefined
}

export type { JoinFormProps }
