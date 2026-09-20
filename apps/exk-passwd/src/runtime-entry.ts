const processName = 'exk_passwd_browser'
const readyMarker = '__EXK_PASSWD_READY__'
const callTimeoutMs = 20_000
const runtimeBootTimeoutMs = 30_000
const bootAttempts = 80
const bootRetryMs = 100

interface CoreFile {
  bytes: number
  sha256: string
}

interface CoreManifest {
  browser_core_version: string
  files: Record<string, CoreFile>
}

interface AtomVmModule {
  FS: {
    mkdir: (path: string) => void
    writeFile: (path: string, bytes: Int8Array | Uint8Array) => void
  }
  call: (process: string, message: string) => Promise<string>
}

type AtomVmInit = (options: Record<string, unknown>) => Promise<AtomVmModule>

type CoreReply =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; error: { code: string; message: string } }

interface RequestMessage {
  type: 'request'
  requestId: number
  command: Record<string, unknown>
}

interface VerifiedCore {
  moduleUrl: URL
  bundle: Uint8Array<ArrayBuffer>
}

const hexadecimal = (bytes: ArrayBuffer): string =>
  Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('')

const digest = async (bytes: Uint8Array<ArrayBuffer>): Promise<string> =>
  hexadecimal(await crypto.subtle.digest('SHA-256', bytes))

const fetchBytes = async (url: URL): Promise<Uint8Array<ArrayBuffer>> => {
  const response = await fetch(url, { cache: 'no-store', credentials: 'same-origin' })
  if (!(response.ok && response.type !== 'opaque')) {
    throw new Error(`Browser-core asset unavailable: ${url.pathname}`)
  }
  return new Uint8Array(await response.arrayBuffer())
}

const verifyCore = async (): Promise<VerifiedCore> => {
  if (!(globalThis.crossOriginIsolated && typeof SharedArrayBuffer !== 'undefined')) {
    throw new Error('Cross-origin isolation is required for the AtomVM runtime.')
  }
  const webCrypto = globalThis.crypto as Partial<Crypto> | undefined
  if (typeof webCrypto?.getRandomValues !== 'function' || !webCrypto.subtle) {
    throw new Error('Web Crypto is required and no fallback is permitted.')
  }

  const coreRoot = new URL('browser-core/', globalThis.location.href)
  const manifestName =
    globalThis.location.protocol === 'chrome-extension:' ? 'core-metadata.json' : 'manifest.json'
  const manifestResponse = await fetch(new URL(manifestName, coreRoot), {
    cache: 'no-store',
    credentials: 'same-origin'
  })
  if (!manifestResponse.ok) {
    throw new Error('The browser-core manifest is unavailable.')
  }

  const manifest = (await manifestResponse.json()) as CoreManifest
  const required = ['core/AtomVM.mjs', 'core/AtomVM.wasm', 'core/exk_passwd.avm']
  if (!required.every((path) => manifest.files[path])) {
    throw new Error('The browser-core manifest is incomplete.')
  }

  const verified = new Map<string, Uint8Array<ArrayBuffer>>()
  await Promise.all(
    required.map(async (path) => {
      const bytes = await fetchBytes(new URL(path, coreRoot))
      const file = manifest.files[path]
      if (!(file && bytes.byteLength === file.bytes && (await digest(bytes)) === file.sha256)) {
        throw new Error(`Browser-core integrity check failed: ${path}`)
      }
      verified.set(path, bytes)
    })
  )

  const bundle = verified.get('core/exk_passwd.avm')
  if (!bundle) {
    throw new Error('Verified browser-core files are missing.')
  }

  return {
    moduleUrl: new URL('core/AtomVM.mjs', coreRoot),
    bundle
  }
}

const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
  message = 'The AtomVM call timed out.'
): Promise<T> => {
  let timeout: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => reject(new Error(message)), timeoutMs)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    clearTimeout(timeout)
  }
}

const call = async (
  runtime: AtomVmModule,
  command: Record<string, unknown>
): Promise<CoreReply> => {
  const raw = await withTimeout(runtime.call(processName, JSON.stringify(command)), callTimeoutMs)
  return JSON.parse(raw) as CoreReply
}

const waitForServer = async (runtime: AtomVmModule): Promise<CoreReply> => {
  let lastError = new Error('The ExkPasswd process did not start.')

  for (let attempt = 0; attempt < bootAttempts; attempt += 1) {
    try {
      // biome-ignore lint/performance/noAwaitInLoops: Readiness probes must be sequential.
      return await call(runtime, { action: 'runtime_info' })
    } catch (error) {
      lastError = error instanceof Error ? error : lastError
      await new Promise((resolve) => setTimeout(resolve, bootRetryMs))
    }
  }

  throw lastError
}

const startRuntime = async (): Promise<{ runtime: AtomVmModule; runtimeInfo: CoreReply }> => {
  const core = await verifyCore()
  const runtimeModule = (await import(/* @vite-ignore */ core.moduleUrl.href)) as {
    default: AtomVmInit
  }

  let markReady: (() => void) | undefined
  let rejectBoot: ((reason: Error) => void) | undefined
  const bootReady = new Promise<void>((resolve, reject) => {
    markReady = resolve
    rejectBoot = reject
  })

  const runtime = await runtimeModule.default({
    INITIAL_MEMORY: 64 * 1024 * 1024,
    arguments: ['/data/exk_passwd.avm'],
    onRunTrackedJs: () => null,
    preRun: [
      (module: AtomVmModule) => {
        module.FS.mkdir('/data')
        module.FS.writeFile('/data/exk_passwd.avm', new Int8Array(core.bundle.buffer))
      }
    ],
    print: (message: string) => {
      if (message.includes(readyMarker)) {
        markReady?.()
      }
    },
    printErr: () => undefined,
    onAbort: () => rejectBoot?.(new Error('The AtomVM runtime aborted during startup.'))
  })

  await withTimeout(
    bootReady,
    runtimeBootTimeoutMs,
    'The ExkPasswd process did not finish starting.'
  )

  return { runtime, runtimeInfo: await waitForServer(runtime) }
}

const fatalMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'The local runtime failed closed.'

let initialized = false

globalThis.addEventListener('message', async (event: MessageEvent<{ type?: string }>) => {
  if (initialized) {
    return
  }

  if (
    event.source !== globalThis.parent ||
    event.origin !== globalThis.location.origin ||
    event.data.type !== 'exk-passwd:init' ||
    event.ports.length !== 1
  ) {
    return
  }

  initialized = true

  const [port] = event.ports
  if (!port) {
    return
  }

  try {
    const { runtime, runtimeInfo } = await startRuntime()
    if (!runtimeInfo.ok) {
      throw new Error(runtimeInfo.error.message)
    }

    port.addEventListener('message', (request: MessageEvent<RequestMessage>) => {
      if (request.data.type !== 'request') {
        return
      }

      call(runtime, request.data.command)
        .then((reply) => {
          port.postMessage({
            type: 'response',
            requestId: request.data.requestId,
            reply
          })
        })
        .catch(() => {
          port.postMessage({
            type: 'response',
            requestId: request.data.requestId,
            reply: {
              ok: false,
              error: {
                code: 'runtime_failure',
                message: 'The local runtime failed closed.'
              }
            }
          })
        })
    })
    port.start()
    port.postMessage({ type: 'ready', runtimeInfo: runtimeInfo.data })
  } catch (error) {
    port.postMessage({ type: 'fatal', message: fatalMessage(error) })
    port.close()
  }
})
