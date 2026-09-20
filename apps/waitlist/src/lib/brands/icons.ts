const canvas = 560
const roundedRadius = 112
const ink = '#1b1b1b'
const rootTag = /^\s*<svg\b([^>]*)>/
const closingTag = /<\/svg>\s*$/
const viewBoxAttribute = /\bviewBox="([^"]+)"/

type IconShape = 'rounded' | 'square' | 'maskable'

interface IconSource {
  /** A standalone mark from src/lib/marks. */
  readonly markSource: string
  readonly title: string
  readonly shape: IconShape
}

/** Fraction of the canvas the mark occupies. Maskable stays inside the 80 percent safe circle. */
const markScale: Readonly<Record<IconShape, number>> = {
  rounded: 0.6,
  square: 0.6,
  maskable: 0.5
}

const parseMark = (markSource: string) => {
  const open = rootTag.exec(markSource)
  const viewBox = open ? viewBoxAttribute.exec(open[1] ?? '')?.[1] : undefined
  if (!(open && viewBox && closingTag.test(markSource))) {
    throw new Error('Mark source must be a single <svg> element with a viewBox')
  }
  const inner = markSource.slice(open[0].length).replace(closingTag, '').trim()
  return { viewBox, inner }
}

/**
 * Composes a standalone icon from the approved monochrome mark, centred on
 * an opaque ink background.
 */
const composeIcon = ({ markSource, title, shape }: IconSource): string => {
  const { viewBox, inner } = parseMark(markSource)
  const size = Math.round(canvas * markScale[shape])
  const offset = (canvas - size) / 2
  const radius = shape === 'rounded' ? roundedRadius : 0
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvas} ${canvas}" role="img">
  <title>${title}</title>
  <rect width="${canvas}" height="${canvas}" rx="${radius}" fill="${ink}" />
  <svg xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" x="${offset}" y="${offset}" width="${size}" height="${size}" viewBox="${viewBox}" aria-hidden="true">
    ${inner.replaceAll('\n', '\n    ')}
  </svg>
</svg>
`
}

export { composeIcon }
