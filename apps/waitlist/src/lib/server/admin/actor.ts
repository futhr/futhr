/** An authenticated Access identity and the brands it may touch. */
interface AdminActor {
  readonly identity: string
  /** Brand ids, or "*" for every brand. */
  readonly grants: ReadonlySet<string>
}

export type { AdminActor }
