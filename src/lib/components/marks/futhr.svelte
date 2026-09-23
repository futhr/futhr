<script lang="ts">
  import mark from '$site/marks/futhr.svg?raw'

  const svg = mark.replace('<svg', '<svg aria-hidden="true"')
</script>

<span role="img" aria-label="Futhr mark">{@html svg}</span>
