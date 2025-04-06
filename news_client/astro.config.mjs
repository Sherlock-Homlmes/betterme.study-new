import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import tailwind from "@astrojs/tailwind";

// import partytown from "@astrojs/partytown";

import partytown from "@astrojs/partytown";

import svelte from "@astrojs/svelte";

// https://astro.build/config
export default defineConfig({
	output: "server",
	adapter: cloudflare(),
	site: "https://betterme.news/",
	// Write here your website url
	markdown: {
		drafts: true,
		shikiConfig: {
			theme: "material-theme-palenight",
			wrap: true,
		},
	},
	integrations: [tailwind(), partytown(), svelte()],
	i18n: {
		defaultLocale: "vi",
		locales: ["en", "vi"],
		routing: {
			prefixDefaultLocale: false,
		},
	},
});
