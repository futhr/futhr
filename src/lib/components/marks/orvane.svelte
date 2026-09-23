<script lang="ts">
  import mark from '$site/marks/orvane.svg?raw'

  const svg = mark.replace('<svg', '<svg aria-hidden="true"')
</script>

<span role="img" aria-label="Orvane mark">{@html svg}</span>
