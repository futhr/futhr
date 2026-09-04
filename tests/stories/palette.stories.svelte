<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import { expect } from 'storybook/test'
  import MarkerLink from '$lib/components/marker-link.svelte'
  import { palette } from '$lib/config/palette'

  const week = [...palette.slice(1), palette[0]]

  const { Story } = defineMeta({
    title: 'Brand/Weekly colours',
    parameters: {
      docs: {
        description: {
          component:
            'The brand colour changes with the weekday. Each cube shows the colour on ink and on paper next to a sample hover link, with its name, hex, and rgb values. The site selects the day before first paint through the data-day attribute on the root element.'
        }
      }
    }
  })
</script>

<Story
  name="Palette"
  asChild
  play={async ({ canvas }) => {
    await expect(canvas.getAllByRole('listitem')).toHaveLength(7)
    await expect(canvas.getByText('#e4472b')).toBeVisible()
  }}
>
  <div class="min-h-dvh bg-ink p-12 font-system text-paper">
    <ul class="m-0 grid list-none grid-cols-7 gap-4 p-0 max-lg:grid-cols-4 max-md:grid-cols-2">
      {#each week as entry (entry.day)}
        <li class="flex flex-col gap-3" style={`--brand:${entry.hex}`}>
          <div class="grid aspect-square grid-rows-2 overflow-hidden">
            <div class="grid place-items-center" style={`background:${entry.hex}`}>
              <span class="text-4xl font-bold text-ink">{entry.short}</span>
            </div>
            <div class="grid grid-cols-2">
              <div class="grid place-items-center bg-ink text-sm">
                <MarkerLink href="https://futhr.io/" label={`${entry.name} on ink`}
                  >link</MarkerLink
                >
              </div>
              <div class="grid place-items-center bg-paper text-sm text-ink">
                <MarkerLink href="https://futhr.io/" label={`${entry.name} on paper`}
                  >link</MarkerLink
                >
              </div>
            </div>
          </div>
          <div class="text-[13px] leading-[1.5]">
            <div class="font-bold">{entry.name}</div>
            <div class="text-muted">{entry.hex}</div>
            <div class="text-muted">rgb({entry.rgb.replaceAll(' ', ', ')})</div>
          </div>
        </li>
      {/each}
    </ul>
  </div>
</Story>
