<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import { expect } from 'storybook/test'
  import Marks from '$lib/components/marks.svelte'

  const markNames = [
    'Refpath',
    'Bytly',
    'Diggymon',
    'Orvane',
    'Reloved',
    'Rivure',
    'Äger',
    'Recetas'
  ]
  const { Story } = defineMeta({
    title: 'Brand/Venture marks',
    component: Marks,
    globals: {
      backgrounds: { value: 'ink' }
    },
    parameters: {
      docs: {
        description: {
          component:
            'The eight venture marks on ink, in footer order. Each is its own Svelte component drawn in currentColor.'
        }
      }
    }
  })
</script>

<Story
  name="Gallery"
  asChild
  play={async ({ canvas }) => {
    await Promise.all(
      markNames.map((name) =>
        expect(canvas.getByRole('img', { name: `${name} mark` })).toBeVisible()
      )
    )
    await expect(canvas.getAllByRole('img')).toHaveLength(8)
  }}
>
  <div class="grid min-h-dvh place-items-center bg-ink p-12 text-paper">
    <div class="w-[min(80vw,900px)]">
      <Marks />
    </div>
  </div>
</Story>
