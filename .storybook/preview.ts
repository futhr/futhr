import type { Preview } from '@storybook/svelte'
import '$lib/styles/site.css'

const preview: Preview = {
  tags: ['autodocs'],
  parameters: {
    a11y: {
      test: 'error'
    },
    backgrounds: {
      options: {
        paper: { name: 'Paper', value: '#dcdbd6' },
        ink: { name: 'Ink', value: '#1b1b1b' }
      }
    },
    controls: {
      expanded: true
    },
    layout: 'fullscreen'
  },
  initialGlobals: {
    backgrounds: { value: 'ink' }
  }
}

export default preview
