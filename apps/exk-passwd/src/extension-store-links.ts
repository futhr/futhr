type StoreEnvironment = Readonly<Record<string, boolean | string | undefined>>

interface StoreLinks {
  chromium?: string
}

const storeDefinitions = {
  chromium: {
    environmentKey: 'VITE_EXK_PASSWD_CHROMIUM_STORE_URL',
    hostname: 'chromewebstore.google.com',
    pathPattern: /^\/detail\/(?:[^/]+\/)?[a-p]{32}\/?$/
  }
} as const

export const resolveExtensionStoreLinks = (
  environment: StoreEnvironment,
  requireAll = false
): StoreLinks => {
  const links: StoreLinks = {}

  for (const [browser, definition] of Object.entries(storeDefinitions)) {
    const rawValue = environment[definition.environmentKey]
    const value = typeof rawValue === 'string' ? rawValue.trim() : ''
    if (!value && requireAll) {
      throw new Error(`${definition.environmentKey} is required for an extension release.`)
    }

    if (value) {
      let url: URL
      try {
        url = new URL(value)
      } catch (error) {
        throw new Error(`${definition.environmentKey} must be an absolute URL.`, { cause: error })
      }

      if (
        url.protocol !== 'https:' ||
        url.hostname !== definition.hostname ||
        url.port !== '' ||
        url.username !== '' ||
        url.password !== '' ||
        !definition.pathPattern.test(url.pathname)
      ) {
        throw new Error(
          `${definition.environmentKey} must be an HTTPS listing URL on ${definition.hostname}.`
        )
      }

      links[browser as keyof StoreLinks] = url.href
    }
  }

  return links
}
