import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'

import Screenshot from './components/Screenshot.vue'
import ScreenList from './components/ScreenList.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // Registered globally so every .md file can use them without an import.
    app.component('Screenshot', Screenshot)
    app.component('ScreenList', ScreenList)
  },
} satisfies Theme
