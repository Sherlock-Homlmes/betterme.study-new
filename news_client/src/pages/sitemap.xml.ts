import { fetchLink } from "src/utils/config";
import {
	IvolunteerPageContentTypeEnum,
	IvolunteerPageTagsEnum,
} from "@/types/enums";

export async function GET() {
	const siteUrl = import.meta.env.SITE;
	// TODO: refactor this
	const contentTypes = [
		IvolunteerPageContentTypeEnum.VOLUNTEER,
		IvolunteerPageContentTypeEnum.COURSE,
		IvolunteerPageContentTypeEnum.SCHORLARSHIP,
		IvolunteerPageContentTypeEnum.EVENT,
	];
	const contentTypeTags = [
		IvolunteerPageTagsEnum.VOLUNTEER,
		IvolunteerPageTagsEnum.COURSE,
		IvolunteerPageTagsEnum.SCHORLARSHIP,
		IvolunteerPageTagsEnum.EVENT,
	];
	const getContentTypesSitemapData = async () => {
		return await Promise.all(
			contentTypeTags.map(async (tag) => {
				const res = await fetch(
					`${fetchLink}/posts?per_page=1&match_tags=${tag}`,
				);
				return await res.json();
			}),
		).then((responses) => {
			return contentTypes.map((contentType, idx) => ({
				contentType,
				lastModified:
					responses[idx][0].updated_at ?? responses[idx][0].created_at,
			}));
		});
	};
	const contentTypesSitemapData = await getContentTypesSitemapData();

	const result = `
        <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${contentTypesSitemapData
					.map((data) => {
						return `<sitemap><loc>${siteUrl}sitemap-${data.contentType}.xml</loc><lastmod>${data.lastModified}+07:00</lastmod></sitemap>`;
					})
					.join("\n")}
        </sitemapindex>
    `.trim();

	return new Response(result, {
		headers: {
			"Content-Type": "application/xml",
		},
	});
}
