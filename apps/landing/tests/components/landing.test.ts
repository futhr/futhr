import { afterEach, expect, test } from 'vitest'
import { cleanup, render } from 'vitest-browser-svelte'
// biome-ignore lint/correctness/noUnresolvedImports: Svelte components have an implicit default export
import ProjectLanding from '../../src/lib/components/project-landing.svelte'
import { projects } from '../../src/lib/projects.ts'
import '../../src/lib/styles/landing.css'

afterEach(() => cleanup())

test.each(Object.values(projects))('renders the $name identity', async (project) => {
  const screen = await render(ProjectLanding, { project })
  await expect.element(screen.getByRole('heading', { level: 1, name: project.name })).toBeVisible()
  await expect.element(screen.getByRole('img', { name: `${project.name} mark` })).toBeVisible()
  expect(screen.container.querySelectorAll('.landing-relationship')).toHaveLength(
    project.relationship ? 1 : 0
  )
  expect(screen.container.querySelectorAll('a')).toHaveLength(project.link ? 1 : 0)
})

test('removes optional mark, copy, relationship and link regions completely', async () => {
  const project = {
    id: 'recetas',
    name: 'Recetas',
    host: 'recetas.co.com',
    indexed: false
  } as const
  const screen = await render(ProjectLanding, { project })
  expect(
    screen.container.querySelector(
      'svg, a, .landing-statement, .landing-description, .landing-relationship'
    )
  ).toBeNull()
})
