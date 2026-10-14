import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: { $site: new URL('../src/lib', import.meta.url).pathname }
  },
  plugins: [tailwindcss(), svelte({ configFile: false, preprocess: vitePreprocess() })]
})
