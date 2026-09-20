import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'

interface FileRecord {
  bytes: number
  sha256: string
}
interface Manifest {
  schema_version: number
  browser_core_version: string
  dictionary: { sha256: string; words: number }
  files: Record<string, FileRecord>
}

const coreDirectory = resolve(import.meta.dirname, '../browser-core')
const manifest = JSON.parse(
  await readFile(resolve(coreDirectory, 'manifest.json'), 'utf8')
) as Manifest
const required = [
  'core/AtomVM.mjs',
  'core/AtomVM.wasm',
  'core/exk_passwd.avm',
  'licenses/ExkPasswd-BSD-2-Clause.md',
  'licenses/FissionVM-Apache-2.0.txt',
  'licenses/Popcorn-Apache-2.0.txt'
]

if (!(manifest.schema_version === 1 && manifest.browser_core_version === '0.1.0')) {
  throw new Error('Unsupported browser-core manifest version.')
}
if (
  manifest.dictionary.sha256 !==
    '18586c092f641ecd1a471dd6ab35618ab69f0aa7483486424f7caf0996d06259' ||
  manifest.dictionary.words !== 7772
) {
  throw new Error('The browser-core dictionary identity is invalid.')
}

for (const path of required) {
  const record = manifest.files[path]
  if (!record) {
    throw new Error(`Browser-core manifest entry is missing: ${path}`)
  }
  const bytes = await readFile(resolve(coreDirectory, path))
  const digest = createHash('sha256').update(bytes).digest('hex')
  if (!(bytes.byteLength === record.bytes && digest === record.sha256)) {
    throw new Error(`Browser-core file failed verification: ${path}`)
  }
}

const runtimeSource = await readFile(resolve(coreDirectory, 'core/AtomVM.mjs'), 'utf8')
if (
  !(
    runtimeSource.includes('globalThis.crypto.getRandomValues') &&
    runtimeSource.includes('webcrypto_strong_rand_bytes')
  )
) {
  throw new Error('The AtomVM runtime does not contain the reviewed Web Crypto NIF.')
}

process.stdout.write('Browser core verified.\n')
