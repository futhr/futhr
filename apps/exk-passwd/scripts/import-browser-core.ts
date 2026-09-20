import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { basename, relative, resolve } from 'node:path'
import process from 'node:process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const appDirectory = resolve(import.meta.dirname, '..')
const repositoryDirectory = resolve(appDirectory, '../..')
const exkPasswdDirectory = resolve(repositoryDirectory, '../exk_passwd')
const targetDirectory = resolve(appDirectory, 'browser-core')
const coreDirectory = resolve(targetDirectory, 'core')
const licensesDirectory = resolve(targetDirectory, 'licenses')
const runtimeDirectory =
  process.env.EXK_PASSWD_ATOMVM_RUNTIME ?? resolve(appDirectory, 'runtime/_release')
const sourceBundle =
  process.env.EXK_PASSWD_BROWSER_BUNDLE ??
  resolve(exkPasswdDirectory, 'browser/_release/core/bundle.avm')
const supportedExkPasswdVersion = '0.4.0'
const exkPasswdLockPattern =
  /"exk_passwd": \{:hex, :exk_passwd, "([^"]+)", "([0-9a-f]{64})", \[:mix\], \[\], "hexpm", "([0-9a-f]{64})"\}/

const sha256 = (bytes: Uint8Array): string => createHash('sha256').update(bytes).digest('hex')

const gitCommit = async (directory: string): Promise<string> => {
  const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: directory })
  return stdout.trim()
}

const gitDirty = async (directory: string): Promise<boolean> => {
  const { stdout } = await execFileAsync('git', ['status', '--short'], { cwd: directory })
  return stdout.trim().length > 0
}

const fileRecord = async (path: string) => {
  const bytes = await readFile(path)
  return { bytes: bytes.byteLength, sha256: sha256(bytes) }
}

const dictionary = await readFile(resolve(exkPasswdDirectory, 'priv/dict/eff_large.txt'))
const expectedDictionary = '18586c092f641ecd1a471dd6ab35618ab69f0aa7483486424f7caf0996d06259'
if (sha256(dictionary) !== expectedDictionary) {
  throw new Error('The ExkPasswd dictionary checksum does not match the browser-core lock.')
}

const browserMixLock = await readFile(resolve(exkPasswdDirectory, 'browser/mix.lock'), 'utf8')
const exkPasswdLock = exkPasswdLockPattern.exec(browserMixLock)
const exkPasswdVersion = exkPasswdLock?.[1]
const exkPasswdChecksum = exkPasswdLock?.[2]
const exkPasswdOuterChecksum = exkPasswdLock?.[3]
if (!(exkPasswdVersion && exkPasswdChecksum && exkPasswdOuterChecksum)) {
  throw new Error('The browser project must lock exk_passwd to a Hex package release.')
}
if (exkPasswdVersion !== supportedExkPasswdVersion) {
  throw new Error(
    `The browser project locks exk_passwd ${exkPasswdVersion}; expected ${supportedExkPasswdVersion}.`
  )
}

const [futhrSourceCommit, futhrSourceDirty] = await Promise.all([
  gitCommit(repositoryDirectory),
  gitDirty(repositoryDirectory)
])

await rm(targetDirectory, { force: true, recursive: true })
await Promise.all([
  mkdir(coreDirectory, { recursive: true }),
  mkdir(licensesDirectory, { recursive: true })
])

const files = [
  [sourceBundle, resolve(coreDirectory, 'exk_passwd.avm')],
  [resolve(runtimeDirectory, 'AtomVM.mjs'), resolve(coreDirectory, 'AtomVM.mjs')],
  [resolve(runtimeDirectory, 'AtomVM.wasm'), resolve(coreDirectory, 'AtomVM.wasm')],
  [
    resolve(exkPasswdDirectory, 'LICENSE.md'),
    resolve(licensesDirectory, 'ExkPasswd-BSD-2-Clause.md')
  ],
  [
    resolve(import.meta.dirname, 'licenses/popcorn-apache-2.0.txt'),
    resolve(licensesDirectory, 'Popcorn-Apache-2.0.txt')
  ],
  [
    resolve(appDirectory, 'runtime/licenses/FissionVM-Apache-2.0.txt'),
    resolve(licensesDirectory, 'FissionVM-Apache-2.0.txt')
  ]
] as const

await Promise.all(files.map(([source, target]) => cp(source, target)))

const trackedFiles = [
  'core/AtomVM.mjs',
  'core/AtomVM.wasm',
  'core/exk_passwd.avm',
  'licenses/ExkPasswd-BSD-2-Clause.md',
  'licenses/FissionVM-Apache-2.0.txt',
  'licenses/Popcorn-Apache-2.0.txt'
]
const records: Record<string, { bytes: number; sha256: string }> = Object.fromEntries(
  await Promise.all(
    trackedFiles.map(async (path) => [path, await fileRecord(resolve(targetDirectory, path))])
  )
)

const manifest = {
  schema_version: 1,
  browser_core_version: '0.1.0',
  futhr_source_commit: futhrSourceCommit,
  futhr_source_dirty: futhrSourceDirty,
  exk_passwd: {
    version: exkPasswdVersion,
    source: 'hexpm',
    checksum: exkPasswdChecksum,
    outer_checksum: exkPasswdOuterChecksum
  },
  runtime: {
    popcorn_version: '0.3.3',
    popcorn_commit: 'bcb675badf61e428b2c8466f3fbd2bcb587b2d5d',
    fission_vm_commit: '6c3208c7b3dbc7dacc35a19f8de1fa80b358ac73',
    fission_vm_patch_sha256: sha256(
      await readFile(resolve(appDirectory, 'runtime/fissionvm-webcrypto.patch'))
    ),
    elixir_version: '1.17.3',
    otp_version: '26.0.2',
    emscripten_version: '4.0.8'
  },
  dictionary: {
    sha256: expectedDictionary,
    words: 7772
  },
  files: records
}

await writeFile(resolve(targetDirectory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)

const checksums = Object.entries(records)
  .map(([path, record]) => `${record.sha256}  ${path}`)
  .join('\n')
await writeFile(resolve(targetDirectory, 'SHA256SUMS'), `${checksums}\n`)

const sbom = {
  spdxVersion: 'SPDX-2.3',
  dataLicense: 'CC0-1.0',
  SPDXID: 'SPDXRef-DOCUMENT',
  name: 'exk-passwd-browser-core-0.1.0',
  documentNamespace: `https://futhr.io/exk-passwd/sbom/${manifest.futhr_source_commit}`,
  creationInfo: {
    created: '2026-09-20T00:00:00Z',
    creators: ['Organization: Futhr']
  },
  packages: [
    {
      SPDXID: 'SPDXRef-ExkPasswd',
      name: 'exk_passwd',
      versionInfo: manifest.exk_passwd.version,
      downloadLocation: `https://repo.hex.pm/tarballs/exk_passwd-${manifest.exk_passwd.version}.tar`,
      licenseConcluded: 'BSD-2-Clause',
      licenseDeclared: 'BSD-2-Clause',
      filesAnalyzed: false
    },
    {
      SPDXID: 'SPDXRef-FissionVM',
      name: 'FissionVM',
      versionInfo: manifest.runtime.fission_vm_commit,
      downloadLocation: 'https://github.com/software-mansion-labs/FissionVM',
      licenseConcluded: 'Apache-2.0',
      licenseDeclared: 'Apache-2.0',
      filesAnalyzed: false
    },
    {
      SPDXID: 'SPDXRef-Popcorn',
      name: '@swmansion/popcorn',
      versionInfo: manifest.runtime.popcorn_version,
      downloadLocation: 'https://github.com/software-mansion/popcorn',
      licenseConcluded: 'Apache-2.0',
      licenseDeclared: 'Apache-2.0',
      filesAnalyzed: false
    }
  ]
}
await writeFile(resolve(targetDirectory, 'sbom.spdx.json'), `${JSON.stringify(sbom, null, 2)}\n`)

const imported = relative(repositoryDirectory, targetDirectory)
const sourceName = basename(sourceBundle)
process.stdout.write(`Imported ${sourceName} into ${imported}\n`)
