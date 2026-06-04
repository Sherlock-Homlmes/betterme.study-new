import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const docs = await getCollection('docs');
  const blogs = await getCollection('blog', ({ data }) => !data.draft);

  const docItems = docs.map((doc) => ({
    title: doc.data.title,
    description: doc.data.description,
    link: String(doc.id).replace(/\.(md|mdx)$/, ''),
    pubDate: doc.data.date,
  }));

  const blogItems = blogs.map((post) => ({
    title: post.data.title,
    description: post.data.description,
    link: `/blog/${post.id.replace(/\.(md|mdx)$/, '')}`,
    pubDate: post.data.pubDate,
    categories: post.data.tags,
  }));

  return rss({
    title: 'BetterMe',
    description: 'Cộng đồng học tập và phát triển bản thân dành cho người Việt',
    site: context.site,
    items: [...docItems, ...blogItems]
      .sort((a, b) => b.pubDate?.valueOf?.() - a.pubDate?.valueOf?.() || 0),
    customData: '<language>vi</language>',
  });
}
