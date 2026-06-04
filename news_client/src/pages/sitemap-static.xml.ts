export async function GET() {
	const siteUrl = import.meta.env.SITE;

	const staticPages = [
		"/",
		"/search",
		"/privacy-policy/",
	];

	const result = `
        <?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${staticPages
					.map((page) => `<url><loc>${siteUrl}${page.replace(/^\//, "")}</loc></url>`)
					.join("\n")}
        </urlset>
    `.trim();

	return new Response(result, {
		headers: {
			"Content-Type": "application/xml",
		},
	});
}
