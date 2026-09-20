import process from 'node:process'
import { resolveExtensionStoreLinks } from '../src/extension-store-links.ts'

const strict = process.argv.includes('--strict')
const links = resolveExtensionStoreLinks(process.env, strict)

if (links.chromium) {
  process.stdout.write('ExkPasswd Chrome Web Store listing URL verified.\n')
} else {
  const message =
    'Chrome Web Store listing URL is not configured yet. Using the official store search until publisher verification is complete.'
  process.stderr.write(
    process.env.GITHUB_ACTIONS === 'true'
      ? `::warning title=Chrome Web Store listing pending::${message}\n`
      : `Warning: ${message}\n`
  )
}
