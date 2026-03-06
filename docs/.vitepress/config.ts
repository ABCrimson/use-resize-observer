import { defineConfig } from 'vitepress';

export default defineConfig({
  title: '@crimson_dev/use-resize-observer',
  description: 'Zero-dependency, Worker-native React 19 ResizeObserver hook',
  lang: 'en-US',
  base: '/use-resize-observer/',

  head: [
    ['meta', { name: 'theme-color', content: 'oklch(52% 0.26 11)' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:title', content: '@crimson_dev/use-resize-observer' }],
    [
      'meta',
      {
        name: 'og:description',
        content: 'Zero-dependency, Worker-native React 19 ResizeObserver hook',
      },
    ],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/use-resize-observer/logo.svg' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    [
      'link',
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Geist:wght@300..800&family=Geist+Mono:wght@400..600&family=Spline+Sans:wght@400..700&display=swap',
      },
    ],
  ],

  appearance: 'dark',
  lastUpdated: true,
  cleanUrls: true,

  markdown: {
    theme: {
      dark: 'github-dark-dimmed',
      light: 'github-light',
    },
    lineNumbers: true,
  },

  themeConfig: {
    siteTitle: 'use-resize-observer',

    nav: [
      { text: 'Guide', link: '/guide/getting-started', activeMatch: '/guide/' },
      { text: 'API', link: '/api/', activeMatch: '/api/' },
      { text: 'Demos', link: '/demos/', activeMatch: '/demos/' },
      { text: 'Blog', link: '/blog/', activeMatch: '/blog/' },
      {
        text: '0.2.0',
        items: [
          { text: 'Changelog', link: '/changelog' },
          { text: 'npm', link: 'https://npmjs.com/package/@crimson_dev/use-resize-observer' },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Why This Library', link: '/guide/why' },
            { text: 'Migration', link: '/guide/migration' },
          ],
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Architecture', link: '/guide/architecture' },
            { text: 'Box Models', link: '/guide/box-models' },
            { text: 'Bundle Size', link: '/guide/bundle-size' },
            { text: 'Performance', link: '/guide/performance' },
          ],
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Worker Mode', link: '/guide/worker' },
            { text: 'SSR & RSC', link: '/guide/ssr' },
            { text: 'React Compiler', link: '/guide/compiler' },
            { text: 'Signals', link: '/guide/signals' },
            { text: 'Advanced API', link: '/guide/advanced' },
          ],
        },
        {
          text: 'Reference',
          items: [
            { text: 'Examples', link: '/guide/examples' },
            { text: 'Troubleshooting', link: '/guide/troubleshooting' },
          ],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/ABCrimson/use-resize-observer' }],

    search: {
      provider: 'local',
      options: {
        miniSearch: {
          searchOptions: { fuzzy: 0.2, prefix: true, boost: { title: 4, text: 2 } },
        },
      },
    },

    editLink: {
      pattern: 'https://github.com/ABCrimson/use-resize-observer/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright 2026 Crimson Dev',
    },
  },
});
