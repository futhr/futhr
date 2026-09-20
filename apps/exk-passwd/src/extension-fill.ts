interface ExtensionApi {
  scripting?: {
    executeScript: (options: {
      target: { tabId: number }
      func: (value: string) => { ok: boolean; reason?: string }
      args: [string]
    }) => Promise<Array<{ result?: { ok: boolean; reason?: string } }>>
  }
  tabs?: {
    query: (options: { active: true; currentWindow: true }) => Promise<Array<{ id?: number }>>
  }
}

const extensionApi = (): ExtensionApi | undefined => {
  const host = globalThis as typeof globalThis & {
    browser?: ExtensionApi
    chrome?: ExtensionApi
  }
  return host.browser ?? host.chrome
}

export const fillActiveField = async (password: string): Promise<void> => {
  const api = extensionApi()
  if (!(api?.tabs && api.scripting)) {
    throw new Error('Field filling is available only in the browser extension.')
  }

  const [tab] = await api.tabs.query({ active: true, currentWindow: true })
  if (typeof tab?.id !== 'number') {
    throw new Error('No active browser tab is available.')
  }

  const [{ result } = {}] = await api.scripting.executeScript({
    target: { tabId: tab.id },
    args: [password],
    func: (value: string) => {
      const active = document.activeElement
      const input = active instanceof HTMLInputElement ? active : null
      const supported = input && ['password', 'text', 'search', 'email', 'url'].includes(input.type)

      if (!supported) {
        return { ok: false, reason: 'Focus an editable password or text field first.' }
      }

      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      setter?.call(input, value)
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
      return { ok: true }
    }
  })

  if (!result?.ok) {
    throw new Error(result?.reason ?? 'The active field cannot be filled.')
  }
}
