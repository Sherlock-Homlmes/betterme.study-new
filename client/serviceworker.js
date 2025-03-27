if (!self.define) {
	let e,
		s = {};
	const i = (i, d) => (
		(i = new URL(i + ".js", d).href),
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
	self.define = (d, n) => {
		const c =
			e ||
			("document" in self ? document.currentScript.src : "") ||
			location.href;
		if (s[c]) return;
		let a = {};
		const b = (e) => i(e, c),
			r = { module: { uri: c }, exports: a, require: b };
		s[c] = Promise.all(d.map((e) => r[e] || b(e))).then((e) => (n(...e), a));
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
				{
					url: "dist/_nuxt/4hQt2gBH.js",
					revision: "034f00204735b2d0a317f05a043b64ca",
				},
				{
					url: "dist/_nuxt/6BIaymio.js",
					revision: "033416e5d8f04439e31c5066883d7145",
				},
				{
					url: "dist/_nuxt/Bm0lJfDM.js",
					revision: "5082789f915d6c4d20a914394c6dc987",
				},
				{
					url: "dist/_nuxt/BoHg109o.js",
					revision: "97c9033ca3fead43d583c6bb68be767d",
				},
				{
					url: "dist/_nuxt/builds/latest.json",
					revision: "c878e5051bed3e8b3ba4467676edb4ca",
				},
				{
					url: "dist/_nuxt/builds/meta/dev.json",
					revision: "7689e3972bbedfc8b93205a1a9f8bbd8",
				},
				{
					url: "dist/_nuxt/builds/meta/e691777b-5ece-4948-9ed9-a970709e5500.json",
					revision: "ea7137ebc49ea28484099008843ab0c4",
				},
				{
					url: "dist/_nuxt/BWPOLaJZ.js",
					revision: "ec1f63b75e8176caba452b5e14c39bda",
				},
				{
					url: "dist/_nuxt/BWUYtvb1.js",
					revision: "9aceb9218053478200cbfb97f6ced63b",
				},
				{
					url: "dist/_nuxt/C1K4LLxk.js",
					revision: "8b838da0665948ca655b30e6fb6944fe",
				},
				{
					url: "dist/_nuxt/C2nftvmc.js",
					revision: "f2fb13ec4ef453966225e2dc450a2b66",
				},
				{
					url: "dist/_nuxt/C3EEjemb.js",
					revision: "6b880d2c68ed9d2f40b449adebf5ffbb",
				},
				{
					url: "dist/_nuxt/C8EnNAgv.js",
					revision: "7a1c2235141cd12e872e327c742bd1b0",
				},
				{
					url: "dist/_nuxt/Ck4LNv4c.js",
					revision: "5f6190f8101bc3524a03098fa4fdeb16",
				},
				{
					url: "dist/_nuxt/Co1JlQFp.js",
					revision: "ad8fce92e68db0f400fb0a07a5a1b032",
				},
				{
					url: "dist/_nuxt/CQDyvUG2.js",
					revision: "3fb12ec81c3b0bf781ce3baf3b9b2a85",
				},
				{
					url: "dist/_nuxt/Cuz3C5FY.js",
					revision: "8abd33d57ecde193eda7837291980c4b",
				},
				{
					url: "dist/_nuxt/CX6lC9YM.js",
					revision: "7b9dbec3ddf04c674f3e0b290b529b4a",
				},
				{
					url: "dist/_nuxt/D3HI-gEb.js",
					revision: "f5ad131f41e37aedf266627efb84fb3f",
				},
				{
					url: "dist/_nuxt/Dc4IbdtI.js",
					revision: "8d6db9df641bc633803861545e78a44c",
				},
				{
					url: "dist/_nuxt/De6-PukS.js",
					revision: "67528a8b43f9db75e0fef2b6d02e59f5",
				},
				{
					url: "dist/_nuxt/DROwisGm.js",
					revision: "f9cffd4ec34b9994f21a6e173d0bfc0a",
				},
				{
					url: "dist/_nuxt/DUkuA9_B.js",
					revision: "c44758f784bc3fc50d1def1d39a8a0fc",
				},
				{
					url: "dist/_nuxt/entry.DcuNfn-X.css",
					revision: "04c2e46420c845743650063b83669c52",
				},
				{
					url: "dist/_nuxt/index.MYrFg5eL.css",
					revision: "e299284fe8b7c508da435922bc0e54f5",
				},
				{
					url: "dist/_nuxt/inputNumber.DGGGWFRy.css",
					revision: "1a592663e8cd31657b500066e72666cc",
				},
				{
					url: "dist/_nuxt/NdBBz-bk.js",
					revision: "5a8fd44a5b743e5fec26e4a86ab4ddb8",
				},
				{
					url: "dist/_nuxt/SzaTIgS7.js",
					revision: "755c5c34bc8355d63651dd7c59cfd4a2",
				},
				{
					url: "dist/_nuxt/timer.B1cHaSDa.css",
					revision: "0faaa7ce1f1f16eaae35409969dd4331",
				},
				{
					url: "dist/_payload.json",
					revision: "21b4116e9332167c0911be28df9b13b3",
				},
				{ url: "dist/200.html", revision: "235399d60f241ab45704d5b57bf82db1" },
				{ url: "dist/404.html", revision: "b09b7869cc344460b3e10e15443ea0b3" },
				{
					url: "dist/app_manifest.json",
					revision: "606482bff098f527aa7359fa0a7dca3c",
				},
				{
					url: "dist/auth/discord-oauth.html",
					revision: "140cf4e9e2f8e587ca2e424464498761",
				},
				{
					url: "dist/auth/discord-oauth/_payload.json",
					revision: "24a38867bfb6e4dbc6266b6aa32745ac",
				},
				{
					url: "dist/favicon.svg",
					revision: "52d6692520ec13a81dd0e448b665d321",
				},
				{
					url: "dist/index.html",
					revision: "5e38ca3a969b1ba94d237140112c3158",
				},
				{ url: "i18n/en.json", revision: "ed971b27970699f9cbf6d80857ceeff9" },
				{ url: "i18n/es.json", revision: "8992cb8c7d514d4b2058be6c7c9e5b8b" },
				{ url: "i18n/fr.json", revision: "9244cfdaf6148ff49bb1dc1ab2fa79e6" },
				{ url: "i18n/hr.json", revision: "56ad9a3fcb244d90faccf23df04885d3" },
				{ url: "i18n/hu.json", revision: "7586c09c7dd3fa49065ff1c8631eb8f9" },
				{ url: "i18n/pt.json", revision: "5749ba38d6ee9b1d640e7ed38bc738a9" },
				{ url: "i18n/vi.json", revision: "50c2b8db0d8fed1a36356c7e242021f2" },
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
