import adapter from '@sveltejs/adapter-static'
import type { Config } from '@sveltejs/kit'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

const config: Config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      fallback: '404.html'
    }),
    prerender: {
      handleHttpError: ({ message, path }) => {
        // The separately built static app is integrated immediately after the
        // SvelteKit prerender completes.
        if (path === '/exk-passwd/') {
          return
        }
        throw new Error(message)
      }
    },
    // The single stylesheet is about 6 KB gzipped; inlining it removes the only
    // render-blocking request on the critical path.
    inlineStyleThreshold: 32 * 1024
  }
}

export default config
