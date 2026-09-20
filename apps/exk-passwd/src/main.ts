import '@fontsource-variable/archivo'
import '@fontsource-variable/archivo/wght-italic.css'
import './styles.css'

import { BrowserCore } from './browser-core'
import { createDropdown } from './dropdown'
import { fillActiveField } from './extension-fill'

type ConfigDescription = {
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
}

const required = <ElementType extends Element>(selector: string): ElementType => {
  const element = document.querySelector<ElementType>(selector)
  if (!element) {
    throw new Error(`Required interface element is missing: ${selector}`)
  }
  return element
}

const status = required<HTMLElement>('#runtime-status')
const fatal = required<HTMLElement>('#fatal-error')
const passwordOutput = required<HTMLOutputElement>('#password')
const feedback = required<HTMLElement>('#feedback')
const regenerate = required<HTMLButtonElement>('#regenerate')
const copy = required<HTMLButtonElement>('#copy')
const fill = required<HTMLButtonElement>('#fill')
const form = required<HTMLFormElement>('#settings')
const preset = required<HTMLSelectElement>('#preset')
const numWords = required<HTMLInputElement>('#num-words')
const separator = required<HTMLInputElement>('#separator')
const caseMode = required<HTMLSelectElement>('#case-mode')
const digitsBefore = required<HTMLInputElement>('#digits-before')
const digitsAfter = required<HTMLInputElement>('#digits-after')
const paddingChar = required<HTMLInputElement>('#padding-char')
const paddingBefore = required<HTMLInputElement>('#padding-before')
const paddingAfter = required<HTMLInputElement>('#padding-after')
const paddingLength = required<HTMLInputElement>('#padding-length')
const substitutionMode = required<HTMLSelectElement>('#substitution-mode')
const seenEntropy = required<HTMLElement>('#seen-entropy')
const blindEntropy = required<HTMLElement>('#blind-entropy')
const entropyNote = required<HTMLElement>('#entropy-note')
const runtimeInfo = required<HTMLDListElement>('#runtime-info')

document.documentElement.dataset.day = String(new Date().getDay())

let currentPassword = ''
let generation = 0
const presets = new Map<string, ConfigDescription>()
const core = new BrowserCore()
const presetDropdown = createDropdown(preset, 'preset-label')
const caseModeDropdown = createDropdown(caseMode, 'case-mode-label')
const substitutionModeDropdown = createDropdown(substitutionMode, 'substitution-mode-label')

const integerValue = (input: HTMLInputElement): number =>
  Number.isFinite(input.valueAsNumber) ? input.valueAsNumber : 0

const currentSettings = () => ({
  preset: preset.value,
  num_words: integerValue(numWords),
  separator: separator.value,
  case_mode: caseMode.value,
  digits_before: integerValue(digitsBefore),
  digits_after: integerValue(digitsAfter),
  padding_char: paddingChar.value,
  padding_before: integerValue(paddingBefore),
  padding_after: integerValue(paddingAfter),
  padding_to_length: integerValue(paddingLength),
  substitution_mode: substitutionMode.value
})

const applyConfig = (config: ConfigDescription): void => {
  numWords.value = String(config.num_words)
  separator.value = config.separator
  caseMode.value = config.case_mode
  digitsBefore.value = String(config.digits_before)
  digitsAfter.value = String(config.digits_after)
  paddingChar.value = config.padding_char
  paddingBefore.value = String(config.padding_before)
  paddingAfter.value = String(config.padding_after)
  paddingLength.value = String(config.padding_to_length)
  substitutionMode.value = config.substitution_mode
  caseModeDropdown.refresh()
  substitutionModeDropdown.refresh()
}

const announce = (message: string): void => {
  feedback.textContent = message
}

const setWorking = (working: boolean): void => {
  regenerate.disabled = working
  copy.disabled = working || currentPassword.length === 0
  fill.disabled = working || currentPassword.length === 0
  form.toggleAttribute('aria-busy', working)
}

const formatBits = (value: number): string => `${value.toFixed(1)} bits`

const generate = async (): Promise<void> => {
  generation += 1
  const thisGeneration = generation
  setWorking(true)
  announce('Generating locally…')

  try {
    const result = await core.generate(currentSettings())
    if (thisGeneration !== generation) {
      return
    }

    currentPassword = result.password
    passwordOutput.textContent = result.password
    seenEntropy.textContent = formatBits(result.entropy.seen)
    blindEntropy.textContent = formatBits(result.entropy.blind)
    entropyNote.textContent = `${result.entropy.status} · seen estimate ${result.entropy.seen_crack_time} at the comparison rate.`
    announce('Generated on this device.')
  } catch (error) {
    if (thisGeneration !== generation) {
      return
    }

    currentPassword = ''
    passwordOutput.textContent = 'Generation stopped'
    announce(error instanceof Error ? error.message : 'Generation failed closed.')
  } finally {
    if (thisGeneration === generation) {
      setWorking(false)
    }
  }
}

const renderRuntimeInfo = (info: Awaited<ReturnType<BrowserCore['ready']>>): void => {
  const entries = [
    ['Elixir package', `exk_passwd v${info.exk_passwd_version}`],
    ['Browser core', `v${info.browser_core_version} · Popcorn ${info.popcorn_version}`],
    ['VM bundle', `AtomVM/WASM · ${info.fission_vm_commit.slice(0, 12)}`],
    ['Execution', 'Same-origin iframe · MessageChannel RPC'],
    ['Core integrity', 'SHA-256 verified before VM boot'],
    ['Random source', info.random_source],
    [
      'Isolation headers',
      globalThis.crossOriginIsolated ? 'COOP/COEP · Cross-origin isolated' : 'Unavailable'
    ],
    [
      'Dictionary',
      `${info.dictionary_words.toLocaleString()} words · ${info.dictionary_checksum.slice(0, 12)}…`
    ],
    ['Persistence', 'Page memory only · cleared on pagehide'],
    ['Generation network', 'No requests']
  ]

  runtimeInfo.replaceChildren(
    ...entries.map(([term, description]) => {
      const row = document.createElement('div')
      const key = document.createElement('dt')
      const value = document.createElement('dd')
      key.textContent = term ?? ''
      value.textContent = description ?? ''
      row.append(key, value)
      return row
    })
  )
}

const boot = async (): Promise<void> => {
  try {
    const info = await core.ready()
    const availablePresets = await core.presets()

    for (const item of availablePresets) {
      const option = document.createElement('option')
      option.value = item.name
      option.textContent = item.name.replaceAll('_', ' ')
      option.title = item.description
      preset.append(option)
      presets.set(item.name, item.config)
    }

    preset.value = 'default'
    presetDropdown.refresh()
    const defaultConfig = presets.get('default')
    if (defaultConfig) {
      applyConfig(defaultConfig)
    }

    renderRuntimeInfo(info)
    status.textContent = 'Elixir ready · offline capable'
    status.dataset.state = 'ready'
    preset.disabled = false
    presetDropdown.refresh()
    regenerate.disabled = false
    await generate()
  } catch (error) {
    status.textContent = 'Runtime unavailable'
    status.dataset.state = 'failed'
    fatal.hidden = false
    fatal.textContent = error instanceof Error ? error.message : 'The local runtime failed closed.'
  }
}

regenerate.addEventListener('click', () => {
  generate().catch(() => announce('Generation failed closed.'))
})

preset.addEventListener('change', () => {
  const config = presets.get(preset.value)
  if (config) {
    applyConfig(config)
  }
  generate().catch(() => announce('Generation failed closed.'))
})

form.addEventListener('submit', (event) => {
  event.preventDefault()
  generate().catch(() => announce('Generation failed closed.'))
})

copy.addEventListener('click', () => {
  if (currentPassword.length === 0) {
    return
  }

  navigator.clipboard
    .writeText(currentPassword)
    .then(() => announce('Copied. Your operating system now controls the clipboard.'))
    .catch(() => announce('Copy failed. Select the password and copy it manually.'))
})

const extensionProtocol = /^(chrome|moz)-extension:$/.test(globalThis.location.protocol)
if (extensionProtocol) {
  fill.hidden = false
  fill.addEventListener('click', () => {
    if (currentPassword.length === 0) {
      return
    }

    fillActiveField(currentPassword)
      .then(() => announce('Filled the focused field on the active page.'))
      .catch((error: unknown) =>
        announce(error instanceof Error ? error.message : 'The active field could not be filled.')
      )
  })
}

globalThis.addEventListener('pagehide', () => {
  currentPassword = ''
  passwordOutput.textContent = '—'
  core.destroy()
})

if (import.meta.env.PROD && 'serviceWorker' in navigator && !extensionProtocol) {
  navigator.serviceWorker
    .register('/exk-passwd/service-worker.js', {
      scope: '/exk-passwd/'
    })
    .catch(() => undefined)
}

boot().catch(() => undefined)
