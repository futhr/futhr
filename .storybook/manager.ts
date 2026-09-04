import { addons } from 'storybook/manager-api'
import { create } from 'storybook/theming'

addons.setConfig({
  theme: create({
    base: 'dark',
    brandTitle: 'futhr:storybook',
    brandUrl: 'https://futhr.io/',
    brandImage: '/brand/brand.svg',
    brandTarget: '_blank',
    fontBase: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    fontCode: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    colorPrimary: '#f5d90a',
    colorSecondary: '#dcdbd6',
    appBg: '#1b1b1b',
    appContentBg: '#1b1b1b',
    appPreviewBg: '#1b1b1b',
    appBorderColor: '#2e2e2e',
    appBorderRadius: 2,
    textColor: '#dcdbd6',
    textInverseColor: '#1b1b1b',
    textMutedColor: '#9a9a94',
    barTextColor: '#9a9a94',
    barSelectedColor: '#dcdbd6',
    barHoverColor: '#f5d90a',
    barBg: '#1b1b1b',
    inputBg: '#1b1b1b',
    inputBorder: '#3a3a3a',
    inputTextColor: '#dcdbd6',
    inputBorderRadius: 2
  })
})
