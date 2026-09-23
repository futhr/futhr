<script lang="ts">
  import mark from '$site/marks/reloved.svg?raw'

  const svg = mark.replace('<svg', '<svg aria-hidden="true"')
</script>

<span role="img" aria-label="Reloved mark">{@html svg}</span>
