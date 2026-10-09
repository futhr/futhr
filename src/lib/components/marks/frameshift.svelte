<script lang="ts">
  import mark from '$site/marks/frameshift.svg?raw'

  const svg = mark.replace('<svg', '<svg aria-hidden="true"')
</script>

<span role="img" aria-label="Frameshift mark">{@html svg}</span>
