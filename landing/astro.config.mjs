// astro.config.mjs
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://betterme.study',
  integrations: [
    starlight({
      title: 'BetterMe',
      head: [
        { tag: 'link', attrs: { rel: 'alternate', type: 'application/rss+xml', title: 'BetterMe', href: '/rss.xml' } },
        { tag: 'link', attrs: { rel: 'sitemap', href: '/sitemap-index.xml' } },
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
            { label: 'Hệ thống kênh', link: '/discord-guides/channel-structure' },
            { label: 'Phòng học Voice Channel', link: '/discord-guides/voice-channel' },
            { label: 'Confession', link: '/discord-guides/confession' },
            { label: 'Hữu duyên', link: '/discord-guides/destiny' },
            {
              label: 'Hệ thống bot',
              items: [
                { label: 'AI bot', link: '/discord-guides/bot/ai' },
              ],
            },
            { label: 'Pomodoro Timer', link: '/discord-guides/pomodoro' },
            { label: 'Thời gian học & bảng xếp hạng', link: '/discord-guides/study-time' },
            { label: 'Tiền tệ', link: '/discord-guides/money' },
            { label: 'An ninh & Kiểm duyệt', link: '/discord-guides/security' },
            { label: 'Event', link: '/discord-guides/events' },
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
    sitemap(),
  ],
});
