import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const root = '.svelte-kit/cloudflare'
const forbidden =
  /(?:waitlist|subscribe|withdrawal|turnstile|D1Database|EMAIL_KEY|localStorage|sessionStorage)/i
const inspect = async (directory: string): Promise<void> => {
  const entries = await readdir(directory, { withFileTypes: true })
  await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) {
        await inspect(path)
        return
      }
      if (path.endsWith('.js') && !path.endsWith('/app.js')) {
        throw new Error(`Unexpected client script: ${path}`)
      }
      if (
        (path.endsWith('.js') || path.endsWith('.html')) &&
        forbidden.test(await readFile(path, 'utf8'))
      ) {
        throw new Error(`Collection code in artifact: ${path}`)
      }
    })
  )
}

await inspect(root)
// The adapter's default ignore file names _worker.js even when its output has
// another name. Keep server code out of the static asset upload explicitly.
const ignorePath = join(root, '.assetsignore')
const ignores = await readFile(ignorePath, 'utf8')
if (!ignores.split('\n').includes('app.js')) {
  await writeFile(ignorePath, `${ignores}\napp.js\n`)
}
