<script lang="ts">
  import mark from '$site/marks/wotex.svg?raw'

  const svg = mark.replace('<svg', '<svg aria-hidden="true"')
</script>

<span role="img" aria-label="WoTEx mark">{@html svg}</span>
