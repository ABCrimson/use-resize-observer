import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import './tokens.css';
import './typography.css';
import './animations.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // Register global components here if needed
  },
} satisfies Theme;
