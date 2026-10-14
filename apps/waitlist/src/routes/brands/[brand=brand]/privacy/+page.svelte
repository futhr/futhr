<script lang="ts">
  import Privacy from '#lib/components/privacy.svelte'
  import { marks } from '#lib/marks.ts'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
</script>

<Privacy brand={data.brand} mark={marks[data.brand.id]} />
