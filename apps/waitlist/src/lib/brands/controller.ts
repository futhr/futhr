/**
 * Who answers for the data. One controller for all five brands until the legal
 * entities are settled; see "Still open" in docs/architecture/waitlist-platform.md.
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
  retention: { reviewMonths: 12 },
  noticeDate: '5 September 2026'
} as const

export { controller }
