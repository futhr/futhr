import { cp, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'

const repositoryDirectory = resolve(import.meta.dirname, '..')
const sourceDirectory = resolve(repositoryDirectory, 'apps/exk-passwd/dist')
const targetDirectories = [
  resolve(repositoryDirectory, 'build/exk-passwd'),
  resolve(repositoryDirectory, '.svelte-kit/output/prerendered/pages/exk-passwd')
]

for (const targetDirectory of targetDirectories) {
  await rm(targetDirectory, { force: true, recursive: true })
  await cp(sourceDirectory, targetDirectory, { recursive: true })
}

process.stdout.write(
  'Integrated the ExkPasswd browser artifact into the build and preview trees.\n'
)
