import type { Brand } from '$lib/types/brand'

/** Every visible string that is not brand copy. Components never hard-code text. */
const strings = {
  label: 'Waitlist',
  language: 'en',
  openGraphLocale: 'en_US',
  skipToForm: 'Skip to the form',
  form: {
    heading: 'Get notified',
    purpose: (brand: Brand) =>
      `Leave your email and hear from ${brand.name} when there is something to announce. Nothing before that.`,
    email: 'Email address',
    submit: 'Notify me',
    submitting: 'Sending…',
    trap: 'Leave this field empty',
    sentHeading: 'You are on the list',
    sent: 'Nothing is sent until there is something to announce.',
    invalidEmail: 'Enter a valid email address.',
    rateLimited: 'Too many attempts from this connection. Try again in a minute.'
  },
  notFound: {
    title: (brand: Brand) => `Not found — ${brand.name}`,
    heading: 'Nothing here',
    text: (brand: Brand) => `The page you asked for does not exist on ${brand.host}.`,
    back: 'Back to the waitlist'
  },
  error: {
    title: (brand: Brand) => `Something went wrong — ${brand.name}`,
    heading: 'Something went wrong',
    text: 'The request could not be completed. Try again in a moment.'
  },
  privacy: {
    title: (brand: Brand) => `Privacy — ${brand.name} waitlist`,
    lede: (brand: Brand) => `What ${brand.host} collects, why, and for how long.`
  },
  footer: {
    privacy: 'Privacy'
  }
} as const

export { strings }
