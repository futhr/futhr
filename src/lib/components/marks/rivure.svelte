<script lang="ts">
  import mark from '$site/marks/rivure.svg?raw'

  const svg = mark.replace('<svg', '<svg aria-hidden="true"')
</script>

<span role="img" aria-label="Rivure mark">{@html svg}</span>
