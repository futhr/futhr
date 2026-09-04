import adapter from '@sveltejs/adapter-static'
import type { Config } from '@sveltejs/kit'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

const config: Config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      fallback: '404.html'
    }),
    // The single stylesheet is about 6 KB gzipped; inlining it removes the only
    // render-blocking request on the critical path.
    inlineStyleThreshold: 32 * 1024
  }
}

export default config
