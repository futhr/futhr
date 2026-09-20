interface DropdownControl {
  refresh: () => void
}

interface DropdownElements {
  menu: HTMLDivElement
  root: HTMLDivElement
  trigger: HTMLButtonElement
  value: HTMLSpanElement
}

const focusItem = (items: HTMLButtonElement[], index: number): void => {
  const item = items[index]
  if (item) {
    item.focus()
  }
}

const buildDropdown = (select: HTMLSelectElement, labelId: string): DropdownElements => {
  const root = document.createElement('div')
  const trigger = document.createElement('button')
  const value = document.createElement('span')
  const menu = document.createElement('div')
  const valueId = `${select.id}-value`

  root.className = 'dropdown'
  trigger.className = 'dropdown-trigger'
  trigger.type = 'button'
  trigger.id = `${select.id}-trigger`
  trigger.setAttribute('aria-haspopup', 'listbox')
  trigger.setAttribute('aria-expanded', 'false')
  trigger.setAttribute('aria-controls', `${select.id}-options`)
  trigger.setAttribute('aria-labelledby', `${labelId} ${valueId}`)
  value.id = valueId
  value.className = 'dropdown-value'
  trigger.append(value)

  menu.className = 'dropdown-menu'
  menu.id = `${select.id}-options`
  menu.role = 'listbox'
  menu.setAttribute('aria-labelledby', labelId)
  menu.hidden = true
  root.append(trigger, menu)
  select.before(root)

  return { menu, root, trigger, value }
}

class Dropdown implements DropdownControl {
  readonly #menu: HTMLDivElement
  readonly #root: HTMLDivElement
  readonly #select: HTMLSelectElement
  readonly #trigger: HTMLButtonElement
  readonly #value: HTMLSpanElement
  #items: HTMLButtonElement[] = []

  constructor(select: HTMLSelectElement, labelId: string) {
    const { menu, root, trigger, value } = buildDropdown(select, labelId)
    this.#menu = menu
    this.#root = root
    this.#select = select
    this.#trigger = trigger
    this.#value = value

    trigger.addEventListener('click', this.#toggle)
    trigger.addEventListener('keydown', this.#handleTriggerKey)
    menu.addEventListener('keydown', this.#handleMenuKey)
    document.addEventListener('pointerdown', this.#handleOutsidePress)
    select.addEventListener('change', this.refresh)
    new MutationObserver(this.refresh).observe(select, {
      attributes: true,
      attributeFilter: ['disabled'],
      childList: true,
      subtree: true
    })
    this.refresh()
  }

  refresh = (): void => {
    const options = Array.from(this.#select.options)
    const [selected] = this.#select.selectedOptions
    this.#value.textContent = selected?.textContent ?? 'Choose'
    this.#trigger.disabled = this.#select.disabled
    this.#items = options.map(this.#createOption)
    this.#menu.replaceChildren(...this.#items)
    if (this.#trigger.disabled) {
      this.#close()
    }
  }

  readonly #createOption = (option: HTMLOptionElement): HTMLButtonElement => {
    const item = document.createElement('button')
    const check = document.createElement('span')
    const label = document.createElement('span')
    item.className = 'dropdown-option'
    item.type = 'button'
    item.role = 'option'
    item.disabled = option.disabled
    item.title = option.title
    item.setAttribute('aria-selected', String(option.selected))
    check.className = 'dropdown-check'
    check.setAttribute('aria-hidden', 'true')
    label.textContent = option.textContent
    item.append(check, label)
    item.addEventListener('click', () => this.#choose(option))
    return item
  }

  readonly #choose = (option: HTMLOptionElement): void => {
    if (option.disabled) {
      return
    }
    this.#select.value = option.value
    this.#select.dispatchEvent(new Event('input', { bubbles: true }))
    this.#select.dispatchEvent(new Event('change', { bubbles: true }))
    this.#close(true)
  }

  readonly #open = (index = this.#select.selectedIndex): void => {
    if (this.#trigger.disabled || this.#items.length === 0) {
      return
    }
    this.#root.dataset.open = ''
    this.#menu.hidden = false
    this.#trigger.setAttribute('aria-expanded', 'true')
    focusItem(this.#items, Math.max(index, 0))
  }

  readonly #close = (returnFocus = false): void => {
    this.#root.removeAttribute('data-open')
    this.#menu.hidden = true
    this.#trigger.setAttribute('aria-expanded', 'false')
    if (returnFocus) {
      this.#trigger.focus()
    }
  }

  readonly #toggle = (): void => {
    if (this.#menu.hidden) {
      this.#open()
    } else {
      this.#close()
    }
  }

  readonly #handleTriggerKey = (event: KeyboardEvent): void => {
    const last = this.#items.length - 1
    const current = this.#select.selectedIndex
    const targets = new Map([
      ['ArrowDown', Math.min(current + 1, last)],
      ['ArrowUp', Math.max(current - 1, 0)],
      ['Home', 0],
      ['End', last]
    ])
    const target = targets.get(event.key)
    if (target !== undefined) {
      event.preventDefault()
      this.#open(target)
    }
  }

  readonly #handleMenuKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      event.preventDefault()
      this.#close(true)
      return
    }
    const current = this.#items.indexOf(document.activeElement as HTMLButtonElement)
    const targets = new Map([
      ['ArrowDown', Math.min(current + 1, this.#items.length - 1)],
      ['ArrowUp', Math.max(current - 1, 0)],
      ['Home', 0],
      ['End', this.#items.length - 1]
    ])
    const target = targets.get(event.key)
    if (target !== undefined) {
      event.preventDefault()
      focusItem(this.#items, target)
    }
  }

  readonly #handleOutsidePress = (event: PointerEvent): void => {
    if (!(event.target instanceof Node && this.#root.contains(event.target))) {
      this.#close()
    }
  }
}

export const createDropdown = (select: HTMLSelectElement, labelId: string): DropdownControl =>
  new Dropdown(select, labelId)
