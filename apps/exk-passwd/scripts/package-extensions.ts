import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const appDirectory = resolve(import.meta.dirname, '..')
const repositoryDirectory = resolve(appDirectory, '../..')
const siteArtifact = resolve(appDirectory, 'dist')
const packagesDirectory = resolve(appDirectory, 'dist-extensions')
const browsers = ['chromium', 'firefox'] as const

await rm(packagesDirectory, { force: true, recursive: true })

for (const browser of browsers) {
  const output = resolve(packagesDirectory, browser)
  await cp(siteArtifact, output, { recursive: true })
  await cp(
    resolve(appDirectory, `extensions/${browser}/manifest.json`),
    resolve(output, 'manifest.json')
  )
  await mkdir(resolve(output, 'icons'), { recursive: true })
  await Promise.all([
    cp(
      resolve(repositoryDirectory, 'static/icons/favicon-48.png'),
      resolve(output, 'icons/favicon-48.png')
    ),
    cp(
      resolve(repositoryDirectory, 'static/icons/favicon.svg'),
      resolve(output, 'icons/favicon.svg')
    ),
    cp(
      resolve(repositoryDirectory, 'static/icons/logo-192.png'),
      resolve(output, 'icons/icon-192.png')
    ),
    cp(
      resolve(repositoryDirectory, 'static/icons/logo-512.png'),
      resolve(output, 'icons/logo-512.png')
    ),
    cp(
      resolve(repositoryDirectory, 'static/icons/logo-maskable-512.png'),
      resolve(output, 'icons/logo-maskable-512.png')
    )
  ])

  const manifest = JSON.parse(await readFile(resolve(output, 'manifest.json'), 'utf8')) as {
    permissions?: string[]
  }
  const permissions = manifest.permissions ?? []
  if (permissions.some((permission) => !['activeTab', 'scripting'].includes(permission))) {
    throw new Error(`${browser} requests an unexpected extension permission.`)
  }

  await writeFile(
    resolve(output, 'PACKAGING-NOTICE.txt'),
    'Publication requires the runtime/isolation release gate.\n'
  )
}
