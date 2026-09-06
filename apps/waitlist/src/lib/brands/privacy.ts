import { controller } from '$lib/brands/controller'
import type { Brand } from '$lib/types/brand'

/**
 * The collection notice for one brand: a few plain paragraphs about this
 * domain and nothing else. The wording is an engineering draft pending
 * qualified review.
 */
const privacyNotice = (brand: Brand): readonly string[] => [
  `${controller.name}, ${controller.location}, is the controller for personal data collected on ${brand.host}. Write to ${controller.contact}.`,
  'The only thing collected is the email address you type into the form, with the time you sent it and the version of this notice. No analytics, no advertising, no profiling, and no cookies of the site’s own. The hosting provider sees ordinary request metadata briefly in its logs.',
  `The address is stored so that ${brand.name} can send ${brand.updates} when there is something to announce, and for nothing else. The legal basis is your consent under Article 6(1)(a) of the GDPR, version ${brand.consentVersion}, given when you press the button. Withdraw it at any time by writing to ${controller.contact}; the address is then deleted.`,
  `Addresses are encrypted before they are written to a database created under the European Union jurisdiction on ${controller.processor.name}’s platform. ${controller.processor.name} is the processor, under its Data Processing Addendum with the EU standard contractual clauses. No one else sees the list.`,
  `The address is kept until ${brand.name} ${brand.updates} begin or you withdraw. The list is reviewed at least every ${controller.retention.reviewMonths} months and deleted if the plan it was collected for is dropped. You also have the rights of access, rectification, restriction, portability, and objection, and you can complain to ${controller.authority.name} at ${controller.authority.url}.`,
  `${controller.noticeDate}. This notice covers ${brand.host} only.`
]

export { privacyNotice }
