// https://nuxt.com/docs/api/configuration/nuxt-config
import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";

export default defineNuxtConfig({
	alias: {
		"@": "/src",
		"@components": "/src/components",
		"@types": "/src/types",
		"@utils": "/src/utils",
	},
	build: {
		transpile: ["vuetify"],
	},
	devtools: { enabled: true },
	modules: [
		(_options, nuxt) => {
			nuxt.hooks.hook("vite:extendConfig", (config) => {
				// @ts-expect-error
				config.plugins.push(vuetify({ autoImport: true }));
			});
		},
		//...
	],
	vite: {
		vue: {
			template: {
				transformAssetUrls,
			},
		},
	},
	runtimeConfig: {
		public: {
			fetchLink: process.env.DEV
				? "http://local.betterme.study/api"
				: process.env.FETCH_LINK ?? "https://api.admin.news.betterme.study/api",
			clientLink: process.env.DEV
				? "http://news.local.betterme.study"
				: "https://news.betterme.study",
		},
	},
});
