<script lang="ts">
  import mark from '$site/marks/diggymon.svg?raw'

  const svg = mark.replace('<svg', '<svg aria-hidden="true"')
</script>

<span role="img" aria-label="Diggymon mark">{@html svg}</span>
