<script lang="ts">
  import mark from '$site/marks/agr.svg?raw'

  const svg = mark.replace('<svg', '<svg aria-hidden="true"')
</script>

<span role="img" aria-label="ÄGR mark">{@html svg}</span>
