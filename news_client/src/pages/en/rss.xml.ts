import rss from "@astrojs/rss";
import { siteConfig } from "@/site-config";
import { fetchLink } from "src/utils/config";
import type { GetPostListResponse } from "@/types/responses";

export async function get() {
	const response = await fetch(`${fetchLink}/posts?per_page=1000000`);
	const posts = (await response.json()) as GetPostListResponse[];
	return rss({
		title: siteConfig.title,
		description: siteConfig.description,
		site: import.meta.env.SITE,
		// TODO: Get more information
		items: posts.map((post) => ({
			title: post.title,
			description: post.description,
			pubDate: new Date(post.created_at),
			link: `posts/${post.slug}/`,
		})),
	});
}
