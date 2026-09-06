// The showcase marks are plain SVG components imported across the workspace
// boundary; this shim gives them a type without relying on project discovery.
declare module '$site/components/logos/*.svelte' {
  import type { Component } from 'svelte'

  const mark: Component
  export default mark
}
