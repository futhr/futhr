<script lang="ts">
  import mark from '$site/marks/ghostshift.svg?raw'

  const svg = mark.replace('<svg', '<svg aria-hidden="true"')
</script>

<span role="img" aria-label="Ghostshift Assembly mark">{@html svg}</span>
