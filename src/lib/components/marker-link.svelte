<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    href: string
    label: string
    seed?: number
    children: Snippet
  }

  let { href, label, seed = 1, children }: Props = $props()

  const random = (value: number) => {
    const result = Math.sin(value * 12.9898) * 43_758.5453
    return result - Math.floor(result)
  }
  const seededRandom = (offset: number) => random(seed * 31 + offset)
  const wobble = (offset: number, amount: number) =>
    (10 + (seededRandom(offset) - 0.5) * amount).toFixed(1)

  const path = $derived(
    `M${(seededRandom(1) * 4).toFixed(1)} ${wobble(2, 6)} C 50 ${wobble(3, 10)}, 100 ${wobble(4, 10)}, ${(196 + seededRandom(5) * 4).toFixed(1)} ${wobble(6, 8)}`
  )
  const secondPath = $derived(
    `M${(2 + seededRandom(7) * 6).toFixed(1)} ${wobble(8, 8)} C 70 ${wobble(9, 12)}, 130 ${wobble(10, 12)}, ${(190 + seededRandom(11) * 8).toFixed(1)} ${wobble(12, 8)}`
  )
</script>

<a
  {href}
  aria-label={label}
  class="group/link relative isolate inline-block px-[0.3em] py-[0.15em] font-semibold text-inherit no-underline"
  target="_blank"
  rel="noopener noreferrer"
  onclick={(event) => event.stopPropagation()}
>
  <svg
    viewBox="0 0 200 20"
    preserveAspectRatio="none"
    aria-hidden="true"
    class="absolute bottom-[-0.02em] left-[-0.15em] h-[0.5em] w-[calc(100%+0.3em)] overflow-visible text-inherit transition-colors duration-150 filter-[url('#marker-stroke')] group-hover/link:text-signal group-focus-visible/link:text-signal motion-reduce:transition-none"
  >
    <path
      d={path}
      fill="none"
      stroke="currentColor"
      stroke-width="2.4"
      stroke-linecap="round"
      class="opacity-35 transition-opacity duration-450 group-hover/link:opacity-100 group-focus-visible/link:opacity-100 motion-reduce:transition-none"
    />
    <path
      d={secondPath}
      fill="none"
      stroke="currentColor"
      stroke-width="1.2"
      stroke-linecap="round"
      class="opacity-25 transition-opacity duration-450 group-hover/link:opacity-100 group-focus-visible/link:opacity-100 motion-reduce:transition-none"
    />
  </svg>
  {@render children()}
</a>
