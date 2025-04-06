import { fetchLink } from "src/utils/config";
import type { GetPostListResponse } from "@/types/responses";
import { IvolunteerPageTagsEnum } from "@/types/enums";

export const generateContentSitemap = async (
	contentType: IvolunteerPageTagsEnum,
) => {
	const siteUrl = import.meta.env.SITE;

	const response = await fetch(
		`${fetchLink}/posts?per_page=100000&match_tags=${contentType}`,
	);
	let postsData = (await response.json()) as GetPostListResponse[];

	const result = `
        <?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${postsData
					.map((post) => {
						const url = `${post.slug}_${post.id}`;
						const lastMod = post.updated_at ?? post.created_at;
						return `<url><loc>${siteUrl}posts/${url}/</loc><lastmod>${lastMod}+07:00</lastmod><changefreq>always</changefreq><priority>0.8</priority></url>`;
					})
					.join("\n")}
        </urlset>
    `.trim();

	return new Response(result, {
		headers: {
			"Content-Type": "application/xml",
		},
	});
};
