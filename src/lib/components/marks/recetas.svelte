<script lang="ts">
  import mark from '$site/marks/recetas.svg?raw'

  const svg = mark.replace('<svg', '<svg aria-hidden="true"')
</script>

<span role="img" aria-label="Recetas mark">{@html svg}</span>
