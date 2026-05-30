import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const docs = await getCollection('docs');
  return rss({
    title: 'BetterMe',
    description: 'Cộng đồng học tập và phát triển bản thân dành cho người Việt',
    site: context.site,
    items: docs
      .sort((a, b) => b.data.date?.valueOf?.() - a.data.date?.valueOf?.() || 0)
      .map((doc) => ({
        title: doc.data.title,
        description: doc.data.description,
        link: `/docs/${doc.id}/`,
      })),
    customData: '<language>vi</language>',
  });
}
