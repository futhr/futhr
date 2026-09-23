<script lang="ts">
  import mark from '$site/marks/refpath.svg?raw'

  const svg = mark.replace('<svg', '<svg aria-hidden="true"')
</script>

<span role="img" aria-label="Refpath mark">{@html svg}</span>
