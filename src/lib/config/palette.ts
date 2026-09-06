/**
 * The weekly brand palette. One colour per weekday, applied site-wide through
 * the `--brand` token in src/lib/styles/site.css, which app.html selects before
 * first paint by setting `data-day` on the root element.
 *
 * Each colour sits at a mid luminance so it reads as a hover and focus colour
 * on both ink and paper. Order follows JavaScript's `Date#getDay`, so Sunday is
 * index 0.
 */
const palette = [
  { day: 'Sunday', short: 'Sun', name: 'Teal', hex: '#1b9a9a' },
  { day: 'Monday', short: 'Mon', name: 'Vermilion', hex: '#e4472b' },
  { day: 'Tuesday', short: 'Tue', name: 'Amber', hex: '#cf7412' },
  { day: 'Wednesday', short: 'Wed', name: 'Jade', hex: '#1f9470' },
  { day: 'Thursday', short: 'Thu', name: 'Azure', hex: '#2b7de0' },
  { day: 'Friday', short: 'Fri', name: 'Violet', hex: '#8f5cf5' },
  { day: 'Saturday', short: 'Sat', name: 'Magenta', hex: '#e0409a' }
] as const

export { palette }
