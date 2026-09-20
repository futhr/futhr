import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const appDirectory = resolve(import.meta.dirname, '../..')
const repositoryDirectory = resolve(appDirectory, '../..')
const browserStoragePattern = /localStorage|sessionStorage|indexedDB/
const commitPattern = /^[0-9a-f]{40}$/
const consoleLoggingPattern = /console\.(?:debug|info|log|warn|error)/

const readJson = async <Value>(path: string): Promise<Value> =>
  JSON.parse(await readFile(path, 'utf8')) as Value

describe('browser-core release controls', () => {
  it('matches every file recorded in its manifest', async () => {
    const coreDirectory = resolve(appDirectory, 'browser-core')
    const manifest = await readJson<{
      dictionary: { sha256: string; words: number }
      exk_passwd: { commit: string; dirty: boolean; version: string }
      files: Record<string, { bytes: number; sha256: string }>
      futhr_source_commit: string
      futhr_source_dirty: boolean
      runtime: {
        elixir_version: string
        emscripten_version: string
        fission_vm_commit: string
        otp_version: string
        popcorn_commit: string
        popcorn_version: string
      }
    }>(resolve(coreDirectory, 'manifest.json'))

    expect(manifest.dictionary).toEqual({
      sha256: '18586c092f641ecd1a471dd6ab35618ab69f0aa7483486424f7caf0996d06259',
      words: 7772
    })
    expect(manifest.runtime).toMatchObject({
      elixir_version: '1.17.3',
      emscripten_version: '4.0.8',
      fission_vm_commit: '6c3208c7b3dbc7dacc35a19f8de1fa80b358ac73',
      otp_version: '26.0.2',
      popcorn_commit: 'bcb675badf61e428b2c8466f3fbd2bcb587b2d5d',
      popcorn_version: '0.3.3'
    })
    expect(manifest.futhr_source_commit).toMatch(commitPattern)
    expect(manifest.exk_passwd.commit).toMatch(commitPattern)
    expect(typeof manifest.futhr_source_dirty).toBe('boolean')
    expect(typeof manifest.exk_passwd.dirty).toBe('boolean')

    for (const [path, expected] of Object.entries(manifest.files)) {
      const bytes = await readFile(resolve(coreDirectory, path))
      expect(bytes.byteLength, path).toBe(expected.bytes)
      expect(createHash('sha256').update(bytes).digest('hex'), path).toBe(expected.sha256)
    }
  })

  it('keeps Web Crypto as the only runtime random source and clears staging bytes', async () => {
    const [patch, runtime] = await Promise.all([
      readFile(resolve(appDirectory, 'runtime/fissionvm-webcrypto.patch'), 'utf8'),
      readFile(resolve(appDirectory, 'browser-core/core/AtomVM.mjs'), 'utf8')
    ])

    expect(patch).toContain('globalThis.crypto.getRandomValues(target)')
    expect(patch).toContain('target.fill(0)')
    expect(runtime).toContain('webcrypto_strong_rand_bytes')
    expect(runtime).toContain('globalThis.crypto.getRandomValues')
    expect(patch).not.toContain('Math.random')
  })
})

describe('extension and host policy', () => {
  it.each(['chromium', 'firefox'])(
    '%s requests only explicit active-tab filling',
    async (browser) => {
      const manifest = await readJson<{
        content_security_policy: { extension_pages: string }
        host_permissions?: string[]
        manifest_version: number
        permissions: string[]
      }>(resolve(appDirectory, `extensions/${browser}/manifest.json`))

      expect(manifest.manifest_version).toBe(3)
      expect(manifest.permissions).toEqual(['activeTab', 'scripting'])
      expect(manifest.host_permissions).toBeUndefined()
      expect(manifest.content_security_policy.extension_pages).toContain(
        "script-src 'self' 'wasm-unsafe-eval'"
      )
      expect(manifest.content_security_policy.extension_pages).not.toContain("'unsafe-eval'")
    }
  )

  it('serves a strict isolated browser path', async () => {
    const headers = await readFile(resolve(repositoryDirectory, 'static/_headers'), 'utf8')
    const section = headers.split('/exk-passwd/*')[1]?.split('/exk-passwd/')[0] ?? ''

    expect(section).toContain('Cross-Origin-Opener-Policy: same-origin')
    expect(section).toContain('Cross-Origin-Embedder-Policy: require-corp')
    expect(section).toContain("script-src 'self' 'wasm-unsafe-eval'")
    expect(section).not.toContain("'unsafe-eval'")
    expect(section).toContain("object-src 'none'")
  })

  it('contains no password persistence or logging path', async () => {
    const sources = await Promise.all(
      ['src/main.ts', 'src/browser-core.ts', 'src/runtime-entry.ts', 'src/extension-fill.ts'].map(
        (path) => readFile(resolve(appDirectory, path), 'utf8')
      )
    )
    const source = sources.join('\n')

    expect(source).not.toMatch(browserStoragePattern)
    expect(source).not.toMatch(consoleLoggingPattern)
    expect(source).not.toContain('Math.random')
  })
})
