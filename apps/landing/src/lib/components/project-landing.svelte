<script lang="ts">
  import { marks } from '$lib/marks'
  import type { Project } from '$lib/types/project'

  let { project }: { project: Project } = $props()
  const Mark = $derived(project.mark ? marks[project.mark] : undefined)
</script>

<main class="landing-shell">
  <div class="landing-frame">
    <div class="landing-composition" class:identity-only={!project.statement}>
      <div class="landing-upper" class:without-mark={!Mark}>
        {#if Mark}
          <div class="landing-mark" class:wide-mark={project.mark === 'wotex'}><Mark /></div>
        {/if}
        <div class="landing-copy">
          <h1>{project.name}</h1>
          {#if project.statement}
            <p class="landing-statement">{project.statement}</p>
          {/if}
          {#if project.description}
            <p class="landing-description">{project.description}</p>
          {/if}
          {#if project.relationship}
            <div class="landing-relationship">
              <div>
                <span>{project.relationship.from.label}</span>
                <p>{project.relationship.from.value}</p>
              </div>
              <div class="landing-arrow" aria-hidden="true"></div>
              <div>
                <span>{project.relationship.to.label}</span>
                <p>{project.relationship.to.value}</p>
              </div>
            </div>
          {/if}
        </div>
      </div>
      <div class="landing-destination">
        {#if project.link}
          <a href={project.link.href}>{project.link.label}</a><span>{project.link.kind}</span>
        {:else}
          <span class="landing-host">{project.host}</span>
        {/if}
      </div>
    </div>
  </div>
</main>
