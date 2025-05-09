if (!self.define) {
	let e,
		s = {};
	const i = (i, n) => (
		(i = new URL(i + ".js", n).href),
		s[i] ||
			new Promise((s) => {
				if ("document" in self) {
					const e = document.createElement("script");
					(e.src = i), (e.onload = s), document.head.appendChild(e);
				} else (e = i), importScripts(i), s();
			}).then(() => {
				let e = s[i];
				if (!e) throw new Error(`Module ${i} didn’t register its module`);
				return e;
			})
	);
	self.define = (n, c) => {
		const a =
			e ||
			("document" in self ? document.currentScript.src : "") ||
			location.href;
		if (s[a]) return;
		let d = {};
		const r = (e) => i(e, a),
			o = { module: { uri: a }, exports: d, require: r };
		s[a] = Promise.all(n.map((e) => o[e] || r(e))).then((e) => (c(...e), d));
	};
}
define(["./workbox-fa5dbb3c"], function (e) {
	"use strict";
	e.enable(),
		self.addEventListener("message", (e) => {
			e.data && "SKIP_WAITING" === e.data.type && self.skipWaiting();
		}),
		e.precacheAndRoute(
			[
				{
					url: "assets/css/disable_tap_highlight.css",
					revision: "549ceca9efa4df647da54eae13777fb5",
				},
				{
					url: "assets/mixins/keyboardListener.js",
					revision: "e8efca3cb2ad3d4e5ecbe12c41d0cfba",
				},
				{
					url: "assets/mixins/settings/settingsItemBase.js",
					revision: "5c5f67f0957c0422c7eaa8a26274b99a",
				},
				{ url: "i18n/en.json", revision: "b8f85006ed1c2420bedd1de7acd24ea6" },
				{ url: "i18n/es.json", revision: "4594d32896de5ad7f390b61931a7b9bf" },
				{ url: "i18n/fr.json", revision: "94e0b7cff1e7cfcddaa9b292204b4d48" },
				{ url: "i18n/hr.json", revision: "f33db79e12c4ed9b4f221dd3f6db321c" },
				{ url: "i18n/hu.json", revision: "8a010bf935552e52f84c8ce8d19ea61a" },
				{ url: "i18n/pt.json", revision: "8c7011b8ed507177273f08a24c619999" },
				{ url: "i18n/vi.json", revision: "56f43d65e57c5e2d2bcf34c0da6ae33f" },
				{ url: "i18n/zh.json", revision: "cb02e2db79e425adb9fba6068fd839aa" },
				{ url: "jsconfig.json", revision: "067bb768824c14fda1bb7415145a9687" },
				{
					url: "package-lock.json",
					revision: "62e02482ed25943dc481cde63bb4371d",
				},
				{ url: "package.json", revision: "d32f840ee5ee77a7bd72adf469cad45d" },
				{
					url: "public/app_manifest.json",
					revision: "606482bff098f527aa7359fa0a7dca3c",
				},
				{
					url: "public/favicon.svg",
					revision: "52d6692520ec13a81dd0e448b665d321",
				},
				{
					url: "public/manifest.json",
					revision: "dea574c5075e2444d7cc1f376d274d6d",
				},
				{
					url: "stylelint.config.js",
					revision: "6714f3fe44208076554ae499b14e30b9",
				},
				{
					url: "tailwind.config.js",
					revision: "1b09cd73b01ddbd58e095cbb9974961b",
				},
				{ url: "tsconfig.json", revision: "a21cd32118755f3eca1ce633fa575485" },
				{
					url: "utils/changeTracker.js",
					revision: "66532fe802ca741d63469ff2c7785e26",
				},
			],
			{},
		),
		e.registerRoute(
			({ url: e }) => null !== /\.(js|json|css)$/.exec(e.pathname),
			new e.CacheFirst({
				cacheName: "code",
				plugins: [new e.CacheableResponsePlugin({ statuses: [0, 200] })],
			}),
			"GET",
		),
		e.registerRoute(
			({ url: e }) => null !== /\.(jpg|png|jpeg|svg)$/.exec(e.pathname),
			new e.CacheFirst({
				cacheName: "assets",
				plugins: [new e.CacheableResponsePlugin({ statuses: [200] })],
			}),
			"GET",
		),
		e.registerRoute(
			({ url: e }) => null !== /\.(woff2)$/.exec(e.pathname),
			new e.StaleWhileRevalidate({
				cacheName: "fonts",
				plugins: [new e.CacheableResponsePlugin({ statuses: [0, 200] })],
			}),
			"GET",
		),
		e.registerRoute(
			({ url: e }) => ["", "/", "/index", "/index.html"].includes(e.pathname),
			new e.NetworkFirst({
				plugins: [new e.CacheableResponsePlugin({ statuses: [0, 200] })],
			}),
			"GET",
		);
});
