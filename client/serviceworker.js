if(!self.define){let e,s={};const n=(n,i)=>(n=new URL(n+".js",i).href,s[n]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=n,e.onload=s,document.head.appendChild(e)}else e=n,importScripts(n),s()})).then((()=>{let e=s[n];if(!e)throw new Error(`Module ${n} didn’t register its module`);return e})));self.define=(i,c)=>{const r=e||("document"in self?document.currentScript.src:"")||location.href;if(s[r])return;let d={};const o=e=>n(e,r),a={module:{uri:r},exports:d,require:o};s[r]=Promise.all(i.map((e=>a[e]||o(e)))).then((e=>(c(...e),d)))}}define(["./workbox-fa5dbb3c"],(function(e){"use strict";e.enable(),self.addEventListener("message",(e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()})),e.precacheAndRoute([{url:"assets/css/disable_tap_highlight.css",revision:"bdf5d2c62c182ab0803510034df51dc2"},{url:"assets/mixins/keyboardListener.js",revision:"6917825f62c6818b40f1faa40b2bd4bd"},{url:"assets/mixins/settings/settingsItemBase.js",revision:"8abf5ddc0685d50beff8f7339cc8fc41"},{url:"i18n/en.json",revision:"e22a90adc053733596e3a0ec1deb5171"},{url:"i18n/es.json",revision:"988efa2e42e7b5c4266aa7046d6babad"},{url:"i18n/fr.json",revision:"9c6582277083daa79d7431fb4cf0f019"},{url:"i18n/hr.json",revision:"fde7c546193de0d518678197e10133eb"},{url:"i18n/hu.json",revision:"6cf4d9d472f8d02265e0a55f82d9887b"},{url:"i18n/pt.json",revision:"3e701afad3b604063c405634c55c8b56"},{url:"i18n/vi.json",revision:"60e4178334fd3924499c3f3d3b387f0f"},{url:"i18n/zh.json",revision:"c83aaf024dec1b04504041bbb29c4d1a"},{url:"jsconfig.json",revision:"1cccb6d72f4371630755e6bb8339fc6b"},{url:"package-lock.json",revision:"64c444eaa3ceb8dfd933fe6cd64cdb4f"},{url:"package.json",revision:"db49d6d97dc3ed68f75a3d20a950e47d"},{url:"public/app_manifest.json",revision:"c4530f7748e9c52e6cbabcc8e7431ec4"},{url:"public/favicon.svg",revision:"52d6692520ec13a81dd0e448b665d321"},{url:"stylelint.config.js",revision:"1d13fd0a3caeaaefe9fdef196b7964ac"},{url:"tailwind.config.js",revision:"fcbc1e8f0522e10638c47e55b2676878"},{url:"tsconfig.json",revision:"07807a46dbdf0707e8087ac313b83239"}],{}),e.registerRoute((({url:e})=>null!==/\.(js|json|css)$/.exec(e.pathname)),new e.CacheFirst({cacheName:"code",plugins:[new e.CacheableResponsePlugin({statuses:[0,200]})]}),"GET"),e.registerRoute((({url:e})=>null!==/\.(jpg|png|jpeg|svg)$/.exec(e.pathname)),new e.CacheFirst({cacheName:"assets",plugins:[new e.CacheableResponsePlugin({statuses:[200]})]}),"GET"),e.registerRoute((({url:e})=>null!==/\.(woff2)$/.exec(e.pathname)),new e.StaleWhileRevalidate({cacheName:"fonts",plugins:[new e.CacheableResponsePlugin({statuses:[0,200]})]}),"GET"),e.registerRoute((({url:e})=>["","/","/index","/index.html"].includes(e.pathname)),new e.NetworkFirst({plugins:[new e.CacheableResponsePlugin({statuses:[0,200]})]}),"GET")}));
