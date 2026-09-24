import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { h } from 'vue'

import Screenshot from './components/Screenshot.vue'
import ScreenList from './components/ScreenList.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'aside-bottom': () =>
        h(
          'a',
          {
            class: 'radius-download-button',
            href: 'https://github.com/InsertCart/radius/releases/latest/download/radius.zip',
            'aria-label': 'Download the latest Radius CMS release',
          },
          'Download Radius CMS',
        ),
    }),
  enhanceApp({ app }) {
    // Registered globally so every .md file can use them without an import.
    app.component('Screenshot', Screenshot)
    app.component('ScreenList', ScreenList)
  },
} satisfies Theme
