interface SiteConfig {
	author: string;
	title: string;
	description: string;
	lang: string;
	ogLocale: string;
	shareMessage: string;
	paginationSize: number;
}

export const siteConfig: SiteConfig = {
	author: "Mie bố láo", // Site author
	title: "Betterme.news", // Site title.
	description:
		"Betterme-Better everyday. Trang thông tin về Câu lạc bộ, tình nguyện, học bổng dành cho học sinh, sinh viên tìm kiếm cơ hội để phát triển bản thân tốt hơn mỗi ngày.", // Description to display in the meta tags lang: 'vi',
	ogLocale: "vi",
	shareMessage: "Share this post", // Message to share a post on social media
	paginationSize: 6, // Number of posts per page
};
