import { describe, expect, it } from 'vitest'
import worker from '../src/lib/server/domain-redirect.ts'

describe('Domain redirects', () => {
  it('redirects Bohwalli while preserving the path and query string', () => {
    const response = worker.fetch(new Request('https://bohwalli.se/work/refpath?source=bohwalli'))

    expect(response.status).toBe(301)
    expect(response.headers.get('location')).toBe('https://futhr.io/work/refpath?source=bohwalli')
  })

  it('redirects Entvue while preserving the path and query string', () => {
    const response = worker.fetch(new Request('https://www.entvue.com/work?source=entvue'))

    expect(response.status).toBe(301)
    expect(response.headers.get('location')).toBe('https://futhr.io/work?source=entvue')
  })

  it('redirects a legacy root to the Futhr root', () => {
    const response = worker.fetch(new Request('https://www.bohwalli.se/'))

    expect(response.status).toBe(301)
    expect(response.headers.get('location')).toBe('https://futhr.io/')
  })

  it('redirects www Futhr without changing the path or query', () => {
    const response = worker.fetch(new Request('https://www.futhr.io/work/recetas?from=www'))

    expect(response.headers.get('location')).toBe('https://futhr.io/work/recetas?from=www')
  })

  it('keeps protocol-relative paths on the approved destination', () => {
    const response = worker.fetch(new Request('https://entvue.com//example.com/path?x=1'))

    expect(response.headers.get('location')).toBe('https://futhr.io//example.com/path?x=1')
  })
})
