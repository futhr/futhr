interface SecretSource {
  readonly EMAIL_KEY_VERSION: string
  readonly EMAIL_DIGEST_KEY: string
  readonly [key: `EMAIL_KEY_${string}`]: string | undefined
}

const versionPattern = /^[a-z0-9]+$/

const required = (name: string, value: string | undefined): string => {
  if (!value) {
    throw new Error(`Missing secret ${name}`)
  }
  return value
}

/**
 * Versioned key material from Worker secrets. `EMAIL_KEY_VERSION` names the
 * key used for new writes; every version still referenced by a row must stay
 * defined as `EMAIL_KEY_<VERSION>` so the admin Worker can read it.
 */
const secrets = (env: SecretSource) => {
  const currentVersion = required('EMAIL_KEY_VERSION', env.EMAIL_KEY_VERSION)
  if (!versionPattern.test(currentVersion)) {
    throw new Error('EMAIL_KEY_VERSION must be lower-case alphanumeric')
  }
  const keyFor = (version: string): string => {
    if (!versionPattern.test(version)) {
      throw new Error('Unknown key version')
    }
    const name = `EMAIL_KEY_${version.toUpperCase()}` as const
    return required(name, env[name])
  }
  return {
    currentVersion,
    currentKey: keyFor(currentVersion),
    keyFor,
    digestKey: required('EMAIL_DIGEST_KEY', env.EMAIL_DIGEST_KEY)
  }
}

export { secrets }
