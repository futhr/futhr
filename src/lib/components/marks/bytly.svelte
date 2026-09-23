<script lang="ts">
  import mark from '$site/marks/bytly.svg?raw'

  const svg = mark.replace('<svg', '<svg aria-hidden="true"')
</script>

<span role="img" aria-label="Bytly mark">{@html svg}</span>
