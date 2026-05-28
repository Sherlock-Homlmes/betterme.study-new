// astro.config.mjs
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'BetterMe Docs',
      sidebar: [
        {
          label: 'Hướng dẫn học tập',
          items: [
            // Trỏ đến các tệp markdown tương ứng trong src/content/docs/
            { label: 'Bắt đầu', link: '/guides/getting-started' },
            { label: 'Phương pháp Pomodoro', link: '/guides/pomodoro' },
          ],
        },
      ],
    }),
  ],
});
