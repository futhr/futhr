/**
 * Who answers for the data. One controller for all four waitlists. Confirm the
 * operational details before launch; see docs/legal/waitlist-operations.md.
 * The contact mailbox is the one already published on futhr.io because the
 * venture mailboxes are not yet provisioned.
 */
const controller = {
  name: 'Tobias Bohwalli',
  location: 'Gothenburg, Sweden',
  contact: 'hi@futhr.io',
  parent: { name: 'futhr:lab', url: 'https://futhr.io/' },
  authority: { name: 'Integritetsskyddsmyndigheten (IMY)', url: 'https://www.imy.se/' },
  processor: {
    name: 'Cloudflare, Inc.',
    role: 'hosting and database',
    dpaUrl: 'https://www.cloudflare.com/cloudflare-customer-dpa/'
  },
  retention: { subscriptionMonths: 12, requestDays: 90, auditMonths: 12 },
  noticeDate: '6 September 2026'
} as const

export { controller }
