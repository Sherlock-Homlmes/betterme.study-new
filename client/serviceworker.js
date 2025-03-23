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
		const r =
			e ||
			("document" in self ? document.currentScript.src : "") ||
			location.href;
		if (s[r]) return;
		let a = {};
		const o = (e) => i(e, r),
			f = { module: { uri: r }, exports: a, require: o };
		s[r] = Promise.all(n.map((e) => f[e] || o(e))).then((e) => (c(...e), a));
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
					revision: "bdf5d2c62c182ab0803510034df51dc2",
				},
				{
					url: "assets/mixins/keyboardListener.js",
					revision: "e8efca3cb2ad3d4e5ecbe12c41d0cfba",
				},
				{
					url: "assets/mixins/settings/settingsItemBase.js",
					revision: "5c5f67f0957c0422c7eaa8a26274b99a",
				},
				{ url: "i18n/en.json", revision: "fc4325c30bef1500ede311ed2e6e16ea" },
				{ url: "i18n/es.json", revision: "8992cb8c7d514d4b2058be6c7c9e5b8b" },
				{ url: "i18n/fr.json", revision: "9244cfdaf6148ff49bb1dc1ab2fa79e6" },
				{ url: "i18n/hr.json", revision: "56ad9a3fcb244d90faccf23df04885d3" },
				{ url: "i18n/hu.json", revision: "7586c09c7dd3fa49065ff1c8631eb8f9" },
				{ url: "i18n/pt.json", revision: "5749ba38d6ee9b1d640e7ed38bc738a9" },
				{ url: "i18n/vi.json", revision: "bd09ea5af7a04bc157fc98805e61f476" },
				{ url: "i18n/zh.json", revision: "35bbe9b9989227816d91e938dafb1e9c" },
				{ url: "jsconfig.json", revision: "067bb768824c14fda1bb7415145a9687" },
				{
					url: "package-lock.json",
					revision: "0f15ce3ae13cdd21c2f0167e108defc0",
				},
				{ url: "package.json", revision: "431378376f1493feb52089dceacc1752" },
				{
					url: "public/app_manifest.json",
					revision: "606482bff098f527aa7359fa0a7dca3c",
				},
				{
					url: "public/favicon.svg",
					revision: "52d6692520ec13a81dd0e448b665d321",
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
