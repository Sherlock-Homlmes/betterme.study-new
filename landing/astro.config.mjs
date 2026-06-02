import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://betterme.dev',
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto',
  },
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
  },
  vite: {
    css: {
      transformer: 'lightningcss',
    },
    build: {
      cssMinify: 'lightningcss',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: false,
          passes: 2,
        },
        mangle: true,
        format: {
          comments: false,
        },
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('astro') || id.includes('starlight')) {
                return 'vendor-astro';
              }
              return 'vendor';
            }
          },
        },
      },
    },
  },
  integrations: [
    starlight({
      title: 'BetterMe',
      head: [
        { tag: 'meta', attrs: { property: 'og:locale', content: 'vi_VN' } },
        { tag: 'link', attrs: { rel: 'alternate', type: 'application/rss+xml', title: 'BetterMe', href: '/rss.xml' } },
        { tag: 'link', attrs: { rel: 'sitemap', href: '/sitemap-index.xml' } },
        { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' } },
        { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' } },
        { tag: 'link', attrs: { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap' } },
      ],
      customCss: ['./src/styles/docs.css'],
      components: {
        Header: './src/components/Header.astro',
        SiteTitle: './src/components/SiteTitle.astro',
        ThemeSelect: './src/components/ThemeSelect.astro',
      },
      sidebar: [
        {
          label: 'Giới thiệu',
          items: [
            { label: 'Giới thiệu BetterMe', link: '/guides/intro' },
          ],
        },
        {
          label: 'Discord học tập',
          items: [
            // TODO: chuyen sang sub directory
            {
              label: 'Hệ thống kênh',
              items: [
                { label: 'Giới thiệu chung', link: '/discord-guides/channel-structure/intro' },
                { label: 'Phòng học', link: '/discord-guides/channel-structure/voice-channel' },
                { label: 'Câu lạc bộ', link: '/discord-guides/channel-structure/club' },
                { label: 'Confession', link: '/discord-guides/channel-structure/confession' },
                { label: 'Hữu duyên', link: '/discord-guides/channel-structure/destiny' },
              ],
            },
            {
              label: 'Hệ thống bot',
              items: [
                { label: 'AI bot', link: '/discord-guides/bot/ai' },
              ],
            },
            { label: 'An ninh & Kiểm duyệt', link: '/discord-guides/security' },
            { label: 'Event', link: '/discord-guides/events' },
            { label: 'Pomodoro Timer', link: '/discord-guides/pomodoro' },
            { label: 'Thời gian học & bảng xếp hạng', link: '/discord-guides/study-time' },
            { label: 'Tiền tệ', link: '/discord-guides/money' },
            { label: 'Tiện ích khác', link: '/discord-guides/errands' },
          ],
        },
        {
          label: 'Thông tin khác',
          items: [
            { label: 'Tài chính', link: '/other-info/finance' },
          ],
        },
      ],
    }),
    sitemap({
      filter: (page) =>
        !page.includes('/auth/discord-oauth/') &&
        !page.includes('/auth/google-oauth/'),
    }),
  ],
});
