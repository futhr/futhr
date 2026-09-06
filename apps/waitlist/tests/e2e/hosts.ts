const port = 24_175

const hosts = [
  { id: 'rivure', host: 'rivure.com', name: 'Rivure' },
  { id: 'diggymon', host: 'diggymon.com', name: 'Diggymon' },
  { id: 'refpath', host: 'refpath.io', name: 'Refpath' },
  { id: 'reloved', host: 'reloved.eco', name: 'Reloved' },
  { id: 'orvane', host: 'orvane.io', name: 'Orvane' }
] as const

const origin = (host: string) => `http://${host}:${port}`

export { hosts, origin, port }
