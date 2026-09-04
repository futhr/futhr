import type { StorybookConfig } from '@storybook/sveltekit'
import { mergeConfig } from 'vite'

const testsDirectory = new URL('../tests', import.meta.url).pathname

const config: StorybookConfig = {
  stories: ['../tests/stories/**/*.stories.svelte'],
  addons: [
    '@storybook/addon-svelte-csf',
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest'
  ],
  framework: {
    name: '@storybook/sveltekit',
    options: {}
  },
  features: {
    sidebarOnboardingChecklist: false
  },
  core: {
    disableTelemetry: true,
    disableWhatsNewNotifications: true
  },
  staticDirs: [
    { from: '../static/licenses', to: '/licenses' },
    { from: './static', to: '/' }
  ],
  viteFinal: (viteConfig) =>
    mergeConfig(viteConfig, {
      server: {
        fs: {
          allow: [...(viteConfig.server?.fs?.allow ?? []), testsDirectory]
        }
      }
    })
}

export default config
