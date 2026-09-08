import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { projects } from '../../src/lib/projects.ts'
import { resolveHost } from '../../src/lib/resolve-host.ts'

describe('closed project map', () => {
  it.each(Object.values(projects))('resolves $host and its explicit local stand-in', (project) => {
    expect(resolveHost(project.host)?.project).toBe(project)
    expect(resolveHost(`www.${project.host}`)).toEqual({ project, redirect: true })
    expect(resolveHost(`${project.id}.localhost`)).toBeUndefined()
    expect(resolveHost(`${project.id}.localhost`, true)?.project).toBe(project)
  })
  it.each([
    'localhost',
    '127.0.0.1',
    'example.com',
    'wotex.io.evil.com',
    'www.www.reloved.eco',
    'recetas.co.com.',
    'reloved.eco:1234'
  ])('rejects %s', (host) => {
    expect(resolveHost(host)).toBeUndefined()
  })
  it('keeps Recetas identity-only and unindexed until copy is approved', () => {
    expect(projects.recetas.indexed).toBe(false)
    expect(projects.recetas.statement).toBeUndefined()
    expect(projects.recetas.link).toBeUndefined()
  })
  it('gives the landing Worker sole ownership of all six domains', async () => {
    const landing = await readFile('wrangler.toml', 'utf8')
    const waitlist = await readFile('../waitlist/wrangler.toml', 'utf8')
    for (const project of Object.values(projects)) {
      expect(landing).toContain(`pattern = "${project.host}"`)
      expect(landing).toContain(`pattern = "www.${project.host}"`)
      expect(waitlist).not.toContain(project.host)
    }
    expect(landing).toContain('run_worker_first = true')
    expect(landing).not.toContain('d1_databases')
    expect(landing).toContain('workers_dev = false')
    expect(landing).toContain('preview_urls = false')
  })
  it.each(Object.values(projects))(
    'generates each $id icon and social image at the expected size',
    async (project) => {
      const svg = await readFile(`static/projects/${project.id}/favicon.svg`, 'utf8')
      const mark = await readFile(`../../src/lib/components/logos/${project.id}.svelte`, 'utf8')
      expect(svg).toContain(mark.replace('<svg ', '<svg x="92" y="92" width="328" height="328" '))
      for (const [file, width, height] of [
        ['favicon-48.png', 48, 48],
        ['apple-touch-icon.png', 180, 180],
        ['icon-192.png', 192, 192],
        ['icon-512.png', 512, 512],
        ['social.png', 1200, 630]
      ] as const) {
        const data = await readFile(`static/projects/${project.id}/${file}`)
        expect([data.readUInt32BE(16), data.readUInt32BE(20)]).toEqual([width, height])
      }
    }
  )
})
