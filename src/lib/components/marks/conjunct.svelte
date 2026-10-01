<script lang="ts">
  import mark from '$site/marks/conjunct.svg?raw'

  const svg = mark.replace('<svg', '<svg aria-hidden="true"')
</script>

<span role="img" aria-label="Conjunct mark">{@html svg}</span>
