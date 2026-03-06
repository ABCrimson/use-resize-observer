import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import './tokens.css';
import './typography.css';
import './animations.css';
import './custom.css';

export default {
  extends: DefaultTheme,
  enhanceApp() {
    // Register global components here if needed
  },
} satisfies Theme;
