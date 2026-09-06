<script lang="ts">
  import Landing from '$lib/components/landing.svelte'
  import { marks } from '$lib/marks'
  import type { ActionData, PageData } from './$types'

  let { data, form }: { data: PageData; form: ActionData } = $props()
</script>

<Landing
  brand={data.brand}
  mark={marks[data.brand.id]}
  joinForm={{ ...data.joinForm, result: form ?? undefined }}
/>
