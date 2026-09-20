const requestTimeoutMs = 15_000
const bootTimeoutMs = 45_000

interface RuntimeInfo {
  browser_core_version: string
  dictionary_checksum: string
  dictionary_words: number
  exk_passwd_version: string
  fission_vm_commit: string
  popcorn_version: string
  random_source: string
}

interface Settings {
  preset: string
  num_words: number
  separator: string
  case_mode: string
  digits_before: number
  digits_after: number
  padding_char: string
  padding_before: number
  padding_after: number
  padding_to_length: number
  substitution_mode: string
}

interface Entropy {
  blind: number
  seen: number
  status: string
  blind_crack_time: string
  seen_crack_time: string
  details: Record<string, number>
}

interface ConfigDescription {
  case_mode: string
  digits_after: number
  digits_before: number
  num_words: number
  padding_after: number
  padding_before: number
  padding_char: string
  padding_to_length: number
  separator: string
  substitution_mode: string
  word_length_max: number
  word_length_min: number
}

interface Preset {
  name: string
  description: string
  config: ConfigDescription
}

interface GenerateResult {
  password: string
  entropy: Entropy
  config: ConfigDescription
}

interface RuntimeError {
  code: string
  message: string
}

type CoreReply<T> = { ok: true; data: T } | { ok: false; error: RuntimeError }

type RuntimeMessage =
  | { type: 'ready'; runtimeInfo: RuntimeInfo }
  | { type: 'response'; requestId: number; reply: CoreReply<unknown> }
  | { type: 'fatal'; message: string }

interface PendingRequest {
  resolve: (reply: CoreReply<unknown>) => void
  timeout: ReturnType<typeof setTimeout>
}

export class BrowserCore {
  readonly #iframe: HTMLIFrameElement
  readonly #port: MessagePort
  readonly #pending = new Map<number, PendingRequest>()
  readonly #ready: Promise<RuntimeInfo>
  #nextRequestId = 0

  constructor() {
    const channel = new MessageChannel()
    this.#port = channel.port1
    this.#port.addEventListener('message', this.#handleMessage)
    this.#port.start()

    this.#iframe = document.createElement('iframe')
    this.#iframe.className = 'runtime-frame'
    this.#iframe.title = 'ExkPasswd Elixir runtime'
    this.#iframe.src = new URL('runtime.html', document.baseURI).href

    this.#ready = new Promise<RuntimeInfo>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('The Elixir runtime did not start.')),
        bootTimeoutMs
      )

      this.#port.addEventListener(
        'message',
        (event: MessageEvent<RuntimeMessage>) => {
          if (event.data.type === 'ready') {
            clearTimeout(timeout)
            resolve(event.data.runtimeInfo)
          } else if (event.data.type === 'fatal') {
            clearTimeout(timeout)
            reject(new Error(event.data.message))
          }
        },
        { signal: AbortSignal.timeout(bootTimeoutMs) }
      )
    })

    this.#iframe.addEventListener(
      'load',
      () => {
        this.#iframe.contentWindow?.postMessage(
          { type: 'exk-passwd:init' },
          globalThis.location.origin,
          [channel.port2]
        )
      },
      { once: true }
    )

    document.body.append(this.#iframe)
  }

  ready(): Promise<RuntimeInfo> {
    return this.#ready
  }

  async generate(settings: Settings): Promise<GenerateResult> {
    return await this.#call<GenerateResult>({ action: 'generate', settings })
  }

  async presets(): Promise<Preset[]> {
    const result = await this.#call<{ presets: Preset[] }>({ action: 'presets' })
    return result.presets
  }

  destroy(): void {
    this.#port.close()
    this.#iframe.remove()
    for (const pending of this.#pending.values()) {
      clearTimeout(pending.timeout)
      pending.resolve({
        ok: false,
        error: { code: 'runtime_closed', message: 'The browser core was closed.' }
      })
    }
    this.#pending.clear()
  }

  async #call<T>(command: Record<string, unknown>): Promise<T> {
    await this.#ready
    const requestId = this.#nextRequestId
    this.#nextRequestId += 1

    const reply = await new Promise<CoreReply<unknown>>((resolve) => {
      const timeout = setTimeout(() => {
        this.#pending.delete(requestId)
        resolve({
          ok: false,
          error: { code: 'runtime_timeout', message: 'The local runtime did not respond.' }
        })
      }, requestTimeoutMs)

      this.#pending.set(requestId, { resolve, timeout })
      this.#port.postMessage({ type: 'request', requestId, command })
    })

    if (!reply.ok) {
      throw new Error(reply.error.message)
    }

    return reply.data as T
  }

  readonly #handleMessage = (event: MessageEvent<RuntimeMessage>): void => {
    const message = event.data
    if (message.type !== 'response') {
      return
    }

    const pending = this.#pending.get(message.requestId)
    if (!pending) {
      return
    }

    clearTimeout(pending.timeout)
    this.#pending.delete(message.requestId)
    pending.resolve(message.reply)
  }
}
