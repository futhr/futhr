/**
 * The weekly brand palette. One colour per weekday, applied site-wide through
 * the `--brand` token in src/lib/styles/site.css, which app.html selects before
 * first paint by setting `data-day` on the root element.
 *
 * The raw hues mark links on ink. Small text uses the lighter signal-light
 * token; link marks on paper use a darker mix with ink. Order follows
 * JavaScript's `Date#getDay`, so Sunday is index 0.
 */
const palette = [
  { day: 'Sunday', short: 'Sun', name: 'Frost teal', hex: '#30dec9' },
  { day: 'Monday', short: 'Mon', name: 'Neon pink', hex: '#ff4f9a' },
  { day: 'Tuesday', short: 'Tue', name: 'Ultraviolet', hex: '#a86bff' },
  { day: 'Wednesday', short: 'Wed', name: 'Acid yellow', hex: '#d9ee3f' },
  { day: 'Thursday', short: 'Thu', name: 'Electric teal', hex: '#00cdb8' },
  { day: 'Friday', short: 'Fri', name: 'Magenta', hex: '#ef45ca' },
  { day: 'Saturday', short: 'Sat', name: 'Violet', hex: '#bd63ff' }
] as const

export { palette }
